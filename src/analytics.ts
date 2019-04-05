import { TrackEvent, ScreenEvent, UIEvent } from './analytics-node-client/src/index';
import { Container } from './container';
import { FeedbackData } from './ipc/configActions';
import { AuthProvider, AuthInfo, ProductJiraStaging, ProductBitbucketStaging, ProductJira, ProductBitbucket } from './atlclients/authInfo';
import { PullRequestTreeViewId, BitbucketIssuesTreeViewId } from './constants';

export const Registry = {
    screen: {
        pullRequestDiffScreen: 'pullRequestDiffScreen'
    }
};

class AnalyticsPlatform {
    private static nodeJsPlatformMapping = {
        'aix': 'desktop',
        'android': 'android',
        'darwin': 'mac',
        'freebsd': 'desktop',
        'linux': 'linux',
        'openbsd': 'desktop',
        'sunos': 'desktop',
        'win32': 'windows',
        'cygwin': 'windows'
    };

    static for(p: string): string {
        return this.nodeJsPlatformMapping[p] || 'unknown';
    }
}

export async function installedEvent(version: string): Promise<TrackEvent> {
    return trackEvent('installed', 'atlascode', { attributes: { machineId: Container.machineId, version: version } });
}

export async function upgradedEvent(version: string, previousVersion: string): Promise<TrackEvent> {
    return trackEvent('upgraded', 'atlascode', { attributes: { machineId: Container.machineId, version: version, previousVersion: previousVersion } });
}

export async function feedbackEvent(feedback: FeedbackData, source: string): Promise<TrackEvent> {
    const attributes = { feedback: feedback.description, feedbackType: feedback.type, canContact: feedback.canBeContacted };
    return trackEvent('submitted', 'atlascodeFeedback', { source: source, attributes: attributes });
}

export async function featureChangeEvent(featureId: string, enabled: boolean): Promise<TrackEvent> {
    let action = enabled ? 'enabled' : 'disabled';
    return trackEvent(action, 'feature', { actionSubjectId: featureId, source: 'atlascodeSettings' });
}

export async function authenticateButtonEvent(source: string): Promise<UIEvent> {
    const e = {
        tenantIdType: null,
        uiEvent: {
            origin: 'desktop',
            platform: AnalyticsPlatform.for(process.platform),
            action: 'clicked',
            actionSubject: 'button',
            actionSubjectId: 'authenticateButton',
            source: source
        }
    };

    return await anyUserOrAnonymous<UIEvent>(e);
}

export async function logoutButtonEvent(source: string): Promise<UIEvent> {
    const e = {
        tenantIdType: null,
        uiEvent: {
            origin: 'desktop',
            platform: AnalyticsPlatform.for(process.platform),
            action: 'clicked',
            actionSubject: 'button',
            actionSubjectId: 'logoutButton',
            source: source
        }
    };

    return await anyUserOrAnonymous<UIEvent>(e);
}

export async function authenticatedEvent(hostProduct: string): Promise<TrackEvent> {
    return trackEvent('authenticated', 'atlascode', { attributes: { machineId: Container.machineId, hostProduct: hostProduct } });
}

export async function loggedOutEvent(hostProduct: string): Promise<TrackEvent> {
    return trackEvent('unauthenticated', 'atlascode', { attributes: { machineId: Container.machineId, hostProduct: hostProduct } });
}

export async function viewScreenEvent(screenName: string, tenantId?: string): Promise<ScreenEvent> {
    const e = {
        tenantIdType: null,
        name: screenName,
        screenEvent: {
            origin: 'desktop',
            platform: AnalyticsPlatform.for(process.platform),
        }
    };

    return await tenantOrNull<ScreenEvent>(e, tenantId).then(async (o) => { return anyUserOrAnonymous<ScreenEvent>(o); });
}

export async function siteSelectedEvent(siteId: string): Promise<TrackEvent> {
    return tenantTrackEvent(siteId, 'selected', 'defaultJiraSite', { actionSubjectId: siteId });
}

export async function projectSelectedEvent(projectId: string, tenantId: string): Promise<TrackEvent> {
    return tenantTrackEvent(tenantId, 'selected', 'defaultJiraProject', { actionSubjectId: projectId });
}

export async function issueCreatedEvent(issueKey: string, tenantId: string): Promise<TrackEvent> {
    return tenantTrackEvent(tenantId, 'created', 'issue', { actionSubjectId: issueKey });
}

export async function issueTransitionedEvent(issueKey: string, tenantId: string): Promise<TrackEvent> {
    return tenantTrackEvent(tenantId, 'transitioned', 'issue', { actionSubjectId: issueKey });
}

export async function issueUrlCopiedEvent(tenantId: string): Promise<TrackEvent> {
    return tenantTrackEvent(tenantId, 'copied', 'issueUrl');
}

export async function issueCommentEvent(tenantId: string): Promise<TrackEvent> {
    return tenantTrackEvent(tenantId, 'created', 'issueComment');
}

export async function issueWorkStartedEvent(tenantId: string): Promise<TrackEvent> {
    return tenantTrackEvent(tenantId, 'workStarted', 'issue');
}

export async function customJQLCreatedEvent(tenantId: string): Promise<TrackEvent> {
    return tenantTrackEvent(tenantId, 'created', 'customJql', { source: 'atlascodeSettings' });
}

export async function prCreatedEvent(): Promise<TrackEvent> {
    return trackEvent('created', 'pullRequest');
}

export async function prCommentEvent(): Promise<TrackEvent> {
    return trackEvent('created', 'pullRequestComment');
}

export async function prCheckoutEvent(): Promise<TrackEvent> {
    return trackEvent('checkedOut', 'pullRequestBranch', { source: 'pullRequestDetailsScreen' });
}

export async function prApproveEvent(): Promise<TrackEvent> {
    return trackEvent('approved', 'pullRequest', { source: 'pullRequestDetailsScreen' });
}

export async function prMergeEvent(): Promise<TrackEvent> {
    return trackEvent('merged', 'pullRequest', { source: 'pullRequestDetailsScreen' });
}

export async function prUrlCopiedEvent(): Promise<TrackEvent> {
    return trackEvent('copied', 'pullRequestUrl');
}

export async function prPaginationEvent(): Promise<UIEvent> {
    const e = {
        tenantIdType: null,
        uiEvent: {
            origin: 'desktop',
            platform: AnalyticsPlatform.for(process.platform),
            action: 'clicked',
            actionSubject: 'button',
            source: 'vscode',
            containerType: 'treeview',
            containerId: PullRequestTreeViewId,
            objectType: 'treenode',
            objectId: 'paginationNode'
        }
    };

    return await anyUserOrAnonymous<UIEvent>(e);
}

export async function bbIssuesPaginationEvent(): Promise<UIEvent> {
    const e = {
        tenantIdType: null,
        uiEvent: {
            origin: 'desktop',
            platform: AnalyticsPlatform.for(process.platform),
            action: 'clicked',
            actionSubject: 'button',
            source: 'vscode',
            containerType: 'treeview',
            containerId: BitbucketIssuesTreeViewId,
            objectType: 'treenode',
            objectId: 'paginationNode'
        }
    };

    return await anyUserOrAnonymous<UIEvent>(e);
}

export async function pipelineStartEvent(): Promise<TrackEvent> {
    return trackEvent('start', 'pipeline');
}

export async function startIssueCreationEvent(source: string): Promise<TrackEvent> {
    return trackEvent('create', 'jiraIssue', { source: source });
}

async function tenantTrackEvent(tenentId: string, action: string, actionSubject: string, otherStuff: any = {}): Promise<TrackEvent> {
    const e = {
        tenantIdType: 'cloudId',
        tenantId: tenentId,
        trackEvent: event(action, actionSubject, otherStuff)
    };

    return await anyUserOrAnonymous<TrackEvent>(e);
}

async function trackEvent(action: string, actionSubject: string, otherStuff: any = {}): Promise<TrackEvent> {
    const e = {
        tenantIdType: null,
        trackEvent: event(action, actionSubject, otherStuff)
    };

    return await anyUserOrAnonymous<TrackEvent>(e);
}

function event(action: string, actionSubject: string, otherStuff: any): any {
    var event = {
        origin: 'desktop',
        platform: AnalyticsPlatform.for(process.platform),
        action: action,
        actionSubject: actionSubject,
        source: 'vscode'
    };
    return Object.assign(event, otherStuff);
}

async function anyUserOrAnonymous<T>(e: Object, hostProduct?: string): Promise<T> {
    console.log(JSON.stringify(e));
    let userType = 'anonymousId';
    let userId = Container.machineId;
    let authInfo: AuthInfo | undefined = undefined;

    let newObj: Object;

    switch (hostProduct) {
        case undefined:
        default: {
            authInfo = await Container.authManager.getAuthInfo(AuthProvider.JiraCloud);
            if (!authInfo) {
                authInfo = await Container.authManager.getAuthInfo(AuthProvider.BitbucketCloud);
            }
            if (!authInfo) {
                authInfo = await Container.authManager.getAuthInfo(AuthProvider.JiraCloudStaging);
            }
            if (!authInfo) {
                authInfo = await Container.authManager.getAuthInfo(AuthProvider.BitbucketCloudStaging);
            }
            break;
        }
        case ProductJira: {
            authInfo = await Container.authManager.getAuthInfo(AuthProvider.JiraCloud);
            break;
        }
        case ProductJiraStaging: {
            authInfo = await Container.authManager.getAuthInfo(AuthProvider.JiraCloudStaging);
            break;
        }
        case ProductBitbucket: {
            authInfo = await Container.authManager.getAuthInfo(AuthProvider.BitbucketCloud);
            break;
        }
        case ProductBitbucketStaging: {
            authInfo = await Container.authManager.getAuthInfo(AuthProvider.BitbucketCloudStaging);
            break;
        }
    }

    if (authInfo) {
        userType = 'userId';
        userId = authInfo.user.id;
    }

    if (userType === 'userId') {
        newObj = { ...e, ...{ userId: userId, userIdType: 'atlassianAccount' } };
    } else {
        newObj = { ...e, ...{ anonymousId: userId } };
    }

    return newObj as T;
}

async function tenantOrNull<T>(e: Object, tenantId?: string): Promise<T> {
    let tenantType: string | null = 'cloudId';
    let newObj: Object;

    if (!tenantId) {
        tenantType = null;
    }
    newObj = { ...e, ...{ tenantIdType: tenantType, tenantId: tenantId } };

    return newObj as T;
}
