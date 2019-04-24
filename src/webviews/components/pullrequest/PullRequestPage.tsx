import * as React from 'react';
import Button, { ButtonGroup } from '@atlaskit/button';
import Page, { Grid, GridColumn } from '@atlaskit/page';
import PageHeader from '@atlaskit/page-header';
import { BreadcrumbsStateless, BreadcrumbsItem } from '@atlaskit/breadcrumbs';
import Panel from '@atlaskit/panel';
import Spinner from '@atlaskit/spinner';
import Tooltip from '@atlaskit/tooltip';
import WarningIcon from '@atlaskit/icon/glyph/warning';
import CheckCircleOutlineIcon from '@atlaskit/icon/glyph/check-circle-outline';
import Reviewers from './Reviewers';
import Commits from './Commits';
import Comments from './Comments';
import { WebviewComponent } from '../WebviewComponent';
import { PRData, CheckoutResult, isPRData } from '../../../ipc/prMessaging';
import { Approve, Merge, Checkout, PostComment, CopyPullRequestLink, RefreshPullRequest } from '../../../ipc/prActions';
import { OpenJiraIssueAction } from '../../../ipc/issueActions';
import CommentForm from './CommentForm';
import BranchInfo from './BranchInfo';
import { Issue } from '../../../jira/jiraModel';
import IssueList from '../issue/IssueList';
import BuildStatus from './BuildStatus';
import NavItem from '../issue/NavItem';
import { OpenPipelineBuildAction } from '../../../ipc/pipelinesActions';
import { HostErrorMessage } from '../../../ipc/messaging';
import ErrorBanner from '../ErrorBanner';
import Offline from '../Offline';
import BitbucketIssueList from '../bbissue/BitbucketIssueList';
import { OpenBitbucketIssueAction } from '../../../ipc/bitbucketIssueActions';

type Emit = Approve | Merge | Checkout | PostComment | CopyPullRequestLink | OpenJiraIssueAction | OpenBitbucketIssueAction | OpenPipelineBuildAction | RefreshPullRequest;
type Receive = PRData | CheckoutResult | HostErrorMessage;

interface ViewState {
    pr: PRData;
    isApproveButtonLoading: boolean;
    isMergeButtonLoading: boolean;
    isCheckoutButtonLoading: boolean;
    isErrorBannerOpen: boolean;
    errorDetails: any;
    isOnline: boolean;
}

const emptyPR = {
    type: '',
    currentBranch: '',
    relatedJiraIssues: [],
    relatedBitbucketIssues: []
};

const emptyState: ViewState = {
    pr: emptyPR,
    isApproveButtonLoading: false,
    isMergeButtonLoading: false,
    isCheckoutButtonLoading: false,
    isErrorBannerOpen: false,
    errorDetails: undefined,
    isOnline: true,

};

export default class PullRequestPage extends WebviewComponent<Emit, Receive, {}, ViewState> {
    constructor(props: any) {
        super(props);
        this.state = emptyState;
    }

    handleApprove = () => {
        this.setState({ isApproveButtonLoading: true });
        this.postMessage({
            action: 'approve'
        });
    }

    handleMerge = () => {
        this.setState({ isMergeButtonLoading: true });
        this.postMessage({
            action: 'merge'
        });
    }

    handlePostComment = (content: string, parentCommentId?: number) => {
        this.postMessage({
            action: 'comment',
            content: content,
            parentCommentId: parentCommentId
        });
    }

    handleIssueClicked = (issue: Issue) => {
        this.postMessage({
            action: 'openJiraIssue',
            issueOrKey: issue
        });
    }

    handleCheckout = (branchName: string) => {
        this.setState({ isCheckoutButtonLoading: true });
        this.postMessage({
            action: 'checkout',
            branch: branchName,
            isSourceBranch: true
        });
    }

    handleCopyLink = () => {
        this.postMessage({
            action: 'copyPullRequestLink'
        });
    }

    onMessageReceived(e: any): void {
        switch (e.type) {
            case 'error': {
                this.setState({ isApproveButtonLoading: false, isMergeButtonLoading: false, isCheckoutButtonLoading: false, isErrorBannerOpen: true, errorDetails: e.reason });
                break;
            }
            case 'checkout': {
                this.setState({ isApproveButtonLoading: false, isMergeButtonLoading: false, isCheckoutButtonLoading: false });
                break;
            }
            case 'update': {
                if (isPRData(e)) {
                    this.setState({ pr: e, isApproveButtonLoading: false, isMergeButtonLoading: false, isCheckoutButtonLoading: false });
                }
                break;
            }
            case 'onlineStatus': {
                let data = e.isOnline ? emptyPR : this.state.pr;
                this.setState({ isOnline: e.isOnline, pr: data });

                if (e.isOnline) {
                    this.postMessage({ action: 'refreshPR' });
                }

                break;
            }
        }
    }

    handleDismissError = () => {
        this.setState({ isErrorBannerOpen: false, errorDetails: undefined });
    }

    render() {
        const pr = this.state.pr.pr!;

        if (!pr && !this.state.isErrorBannerOpen && this.state.isOnline) {
            return (<div>waiting for data...</div>);
        } else if (!pr && !this.state.isOnline) {
            return (
                <div className='bitbucket-page'>
                    <Offline />
                </div>
            );
        }

        const isPrOpen = pr.state === "OPEN";

        let currentUserApproved = pr.participants!
            .filter((participant) => participant.user!.account_id === this.state.pr.currentUser!.account_id)
            .reduce((acc, curr) => !!acc || !!curr.approved, false);

        const actionsContent = (
            <ButtonGroup>
                <Reviewers {...this.state.pr} />
                <Tooltip content={currentUserApproved ? '✔ You approved this pull request' : ''}>
                    <Button className='ac-button' iconBefore={<CheckCircleOutlineIcon label='approve' />}
                        isDisabled={currentUserApproved}
                        isLoading={this.state.isApproveButtonLoading}
                        onClick={this.handleApprove}>
                        Approve
                        </Button>
                </Tooltip>
                <Button className='ac-button'
                    isDisabled={!isPrOpen}
                    isLoading={this.state.isMergeButtonLoading}
                    onClick={this.handleMerge}>
                    {isPrOpen ? 'Merge' : pr.state}
                </Button>
                {
                    this.state.pr.errors && <Tooltip content={this.state.pr.errors}><WarningIcon label='pr-warning' /></Tooltip>
                }
            </ButtonGroup>
        );
        const breadcrumbs = (
            <BreadcrumbsStateless onExpand={() => { }}>
                <BreadcrumbsItem component={() => <NavItem text={this.state.pr.pr!.destination!.repository!.name!} href={this.state.pr.pr!.destination!.repository!.links!.html!.href} />} />
                <BreadcrumbsItem component={() => <NavItem text='Pull requests' href={`${this.state.pr.pr!.destination!.repository!.links!.html!.href}/pull-requests`} />} />
                <BreadcrumbsItem component={() => <NavItem text={`Pull request #${pr.id}`} href={pr.links!.html!.href} onCopy={this.handleCopyLink} />} />
            </BreadcrumbsStateless>
        );

        return (
            <div className='bitbucket-page'>
                {!this.state.isOnline &&
                    <Offline />
                }
                <Page>
                    <Grid>
                        <GridColumn>
                            {this.state.isErrorBannerOpen &&
                                <ErrorBanner onDismissError={this.handleDismissError} errorDetails={this.state.errorDetails} />
                            }
                            <PageHeader
                                actions={actionsContent}
                                breadcrumbs={breadcrumbs}
                            >
                                <p>{pr.title}</p>
                            </PageHeader>
                            <div className='ac-flex-space-between'>
                                <BranchInfo prData={this.state.pr} postMessage={(e: Emit) => this.postMessage(e)} />
                                <div className='ac-flex'>
                                    <Button className='ac-button' spacing='compact' isDisabled={this.state.isCheckoutButtonLoading || pr.source!.branch!.name! === this.state.pr.currentBranch} isLoading={this.state.isCheckoutButtonLoading} onClick={() => this.handleCheckout(pr.source!.branch!.name!)}>
                                        {pr.source!.branch!.name! === this.state.pr.currentBranch ? 'Source branch checked out' : 'Checkout source branch'}
                                    </Button>
                                    <BuildStatus buildStatuses={this.state.pr.buildStatuses} postMessage={(e: OpenPipelineBuildAction) => this.postMessage(e)} />
                                </div>
                            </div>
                            <Panel isDefaultExpanded header={<h3>Summary</h3>}>
                                <p dangerouslySetInnerHTML={{ __html: pr.summary!.html! }} />
                            </Panel>
                            {
                                !this.state.pr.commits && !this.state.pr.comments
                                    ? <div className='ac-block-centered'><Spinner size="large" /></div>
                                    : <React.Fragment>
                                        {
                                            this.state.pr.relatedJiraIssues && this.state.pr.relatedJiraIssues.length > 0 &&
                                            <Panel isDefaultExpanded header={<h3>Related Jira Issues</h3>}>
                                                <IssueList issues={this.state.pr.relatedJiraIssues} postMessage={(e: OpenJiraIssueAction) => this.postMessage(e)} />
                                            </Panel>
                                        }
                                        {
                                            this.state.pr.relatedBitbucketIssues && this.state.pr.relatedBitbucketIssues.length > 0 &&
                                            <Panel isDefaultExpanded header={<h3>Related Bitbucket Issues</h3>}>
                                                <BitbucketIssueList issues={this.state.pr.relatedBitbucketIssues} postMessage={(e: OpenBitbucketIssueAction) => this.postMessage(e)} />
                                            </Panel>
                                        }
                                        <Panel isDefaultExpanded header={<h3>Commits</h3>}>
                                            <Commits {...this.state.pr} />
                                        </Panel>
                                        <Panel isDefaultExpanded header={<h3>Comments</h3>}>
                                            <Comments comments={this.state.pr.comments!} currentUser={this.state.pr.currentUser!} onComment={this.handlePostComment} />
                                            <CommentForm currentUser={this.state.pr.currentUser!} visible={true} onSave={this.handlePostComment} />
                                        </Panel>
                                    </React.Fragment>
                            }
                        </GridColumn>
                    </Grid>
                </Page>
            </div>
        );
    }
}