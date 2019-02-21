import { window, Disposable, TreeDataProvider, TreeView, EventEmitter, Event, TreeViewVisibilityChangeEvent, ConfigurationChangeEvent, Command } from 'vscode';
import { IssueNode } from '../nodes/issueNode';
import { configuration } from '../../config/configuration';
import { Container } from '../../container';
import { AuthProvider } from '../../atlclients/authInfo';
import { viewScreenEvent } from '../../analytics';
import { AbstractIssueTreeNode } from './abstractIssueTreeNode';

export interface RefreshableTree extends Disposable {
    refresh(): void;
}

export interface IssueTree extends RefreshableTree, TreeDataProvider<IssueNode> {
    setJql(jql: string | undefined): void;
}

export abstract class AbstractIssueTree extends AbstractIssueTreeNode implements IssueTree {

    private _onDidChangeTreeData = new EventEmitter<IssueNode>();
    public get onDidChangeTreeData(): Event<IssueNode> {
        return this._onDidChangeTreeData.event;
    }

    private _isVisible = false;
    private _tree: TreeView<IssueNode> | undefined;

    constructor(id: string, jql?: string, emptyState?: string, emptyStateCommand?: Command) {
        super(id, jql, emptyState, emptyStateCommand);

        this._disposables.push(Disposable.from(
            configuration.onDidChange(this.onConfigurationChanged, this)
        ));

        void this.onConfigurationChanged(configuration.initializingChangeEvent);
    }

    public setVisibility(isVisible: boolean) {
        this._isVisible = isVisible;
    }

    protected async onConfigurationChanged(e: ConfigurationChangeEvent) {
        const initializing = configuration.initializing(e);

        if (initializing) {
            this._onDidChangeTreeData = new EventEmitter<IssueNode>();

            if (this._id.length > 0) {
                this._tree = window.createTreeView(this._id, {
                    treeDataProvider: this
                });
                this._tree.onDidChangeVisibility(e => this.onDidChangeVisibility(e));
                this._disposables.push(this._tree);
            }
        }
    }

    refresh() {
        if (this._isVisible) {
            this._issues = undefined;
            this._onDidChangeTreeData.fire();
        }
    }

    setJql(jql: string | undefined) {
        this._jql = jql;
        this.refresh();
    }

    async onDidChangeVisibility(event: TreeViewVisibilityChangeEvent) {
        if (event.visible && await Container.authManager.isAuthenticated(AuthProvider.JiraCloud)) {
            viewScreenEvent(this.id, Container.jiraSiteManager.effectiveSite.id).then(e => { Container.analyticsClient.sendScreenEvent(e); });
        }
        this.setVisibility(event.visible);
    }
}
