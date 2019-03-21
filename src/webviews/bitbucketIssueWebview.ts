import * as vscode from "vscode";
import { AbstractReactWebview, InitializingWebview } from "./abstractWebview";
import { Action } from '../ipc/messaging';
import { BitbucketIssueData } from "../ipc/bitbucketIssueMessaging";
import { currentUserBitbucket } from "../commands/bitbucket/currentUser";
import { BitbucketIssuesApi } from "../bitbucket/bbIssues";
import { isPostComment, isPostChange } from "../ipc/bitbucketIssueActions";

type Emit = BitbucketIssueData;

export class BitbucketIssueWebview extends AbstractReactWebview<Emit, Action> implements InitializingWebview<Bitbucket.Schema.Issue> {

    private _issue?: Bitbucket.Schema.Issue;
    private _currentUser?: Bitbucket.Schema.User;

    constructor(extensionPath: string) {
        super(extensionPath);
    }

    public get title(): string {
        return "Bitbucket Issue ";
    }

    public get id(): string {
        return "bitbucketIssueScreen";
    }

    initialize(data: Bitbucket.Schema.Issue) {
        this._issue = data;
        this.invalidate();
    }

    public async invalidate() {
        if (this._issue) {
            this.update(this._issue);
        }
    }

    private async update(issue: Bitbucket.Schema.Issue) {
        if (this._panel) { this._panel.title = `Bitbucket issue #${issue.id}`; }

        if (!this._currentUser) {
            this._currentUser = await currentUserBitbucket();
        }

        const [issueLatest, comments, changes] = await Promise.all([BitbucketIssuesApi.refetch(issue), BitbucketIssuesApi.getComments(issue), BitbucketIssuesApi.getChanges(issue)]);
        const updatedChanges = changes
            .map(change => {
                let content = '';
                if (change.changes!.state) {
                    content += `<li><em>changed status from <strong>${change.changes!.state!.old}</strong> to <strong>${change.changes!.state!.new}</strong></em></li>`;
                }
                if (change.changes!.kind) {
                    content += `<li><em>changed issue type from <strong>${change.changes!.kind!.old}</strong> to <strong>${change.changes!.kind!.new}</strong></em></li>`;
                }
                if (change.changes!.priority) {
                    content += `<li><em>changed issue priority from <strong>${change.changes!.priority!.old}</strong> to <strong>${change.changes!.priority!.new}</strong></em></li>`;
                }
                //@ts-ignore
                if (change.changes!.attachment && change.changes!.attachment!.new) {
                    //@ts-ignore
                    content += `<li><em>added attachment <strong>${change.changes!.attachment!.new}</strong></em></li>`;
                }
                //@ts-ignore
                if (change.changes!.assignee_account_id) {
                    content += `<li><em>updated assignee</em></li>`;
                }
                if (change.changes!.content) {
                    content += `<li><em>updated description</em></li>`;
                }
                if (change.changes!.title) {
                    content += `<li><em>updated title</em></li>`;
                }

                if (content === '') {
                    content += `<li><em>updated issue</em></li>`;
                }
                return { ...change, content: { html: `<p><ul>${content}</ul>${change.message!.html}</p>` } };
            });

        //@ts-ignore
        // replace comment with change data which contains additional details
        const updatedComments = comments.map(comment => updatedChanges.find(change => change.id! === comment.id!) || comment);
        const msg = {
            type: 'updateBitbucketIssue' as 'updateBitbucketIssue',
            issue: issueLatest,
            currentUser: this._currentUser,
            comments: updatedComments
        };

        this.postMessage(msg);
    }

    protected async onMessageReceived(e: Action): Promise<boolean> {
        let handled = await super.onMessageReceived(e);
        if (!handled) {
            switch (e.action) {
                case 'copyBitbucketIssueLink': {
                    handled = true;
                    const linkUrl = this._issue!.links!.html!.href!;
                    await vscode.env.clipboard.writeText(linkUrl);
                    vscode.window.showInformationMessage(`Copied issue link to clipboard - ${linkUrl}`);
                    break;
                }
                case 'assign': {
                    handled = true;
                    await BitbucketIssuesApi.assign(this._issue!, this._currentUser!.account_id!);
                    this.update(this._issue!);
                    break;
                }
                case 'comment': {
                    if (isPostComment(e)) {
                        handled = true;
                        await BitbucketIssuesApi.postComment(this._issue!, e.content);
                        this.update(this._issue!);
                    }
                    break;
                }
                case 'change': {
                    if (isPostChange(e)) {
                        handled = true;
                        await BitbucketIssuesApi.postChange(this._issue!, e.newStatus, e.content);
                        this._issue = await BitbucketIssuesApi.refetch(this._issue!);
                        this.update(this._issue!);
                    }
                    break;
                }
            }
        }
        return handled;
    }
}
