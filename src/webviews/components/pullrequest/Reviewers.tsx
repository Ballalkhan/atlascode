import * as React from "react";
import { PRData } from '../../../ipc/prMessaging';
import AvatarGroup from '@atlaskit/avatar-group';

export default class Reviewers extends React.Component<PRData, {}> {
    constructor(props: any) {
        super(props);
    }

    render() {
        if (!this.props.pr!.participants) { return <p>No reviewers!</p>; }
        const participants = this.props.pr!.participants!
            .filter(p => p.role === 'REVIEWER')
            .map(p => {
                return {
                    name: p.user!.display_name!,
                    src: p.user!.links!.avatar!.href!,
                    status: p.approved ? 'approved' : undefined
                };
            });
        return (
            <React.Fragment>
                <h3>Reviewers</h3>
                <AvatarGroup
                    appearance="grid"
                    data={participants}
                    maxCount={14}
                    size="medium"
                />
            </React.Fragment>
        );
    }
}