import { Checkbox } from '@atlaskit/checkbox';
import { CheckboxField } from '@atlaskit/form';
import * as React from 'react';
import { IConfig } from '../../../config/model';
import { chain } from '../fieldValidators';

type changeObject = { [key: string]: any };

export default class BitbucketExplorer extends React.Component<
    { config: IConfig; onConfigChange: (changes: changeObject, removes?: string[]) => void },
    {}
> {
    constructor(props: any) {
        super(props);
    }

    onCheckboxChange = (e: any) => {
        const changes = Object.create(null);
        changes[e.target.value] = e.target.checked;

        if (this.props.onConfigChange) {
            this.props.onConfigChange(changes);
        }
    };

    handleNumberChange = (e: any, configKey: string) => {
        const changes = Object.create(null);
        changes[configKey] = +e.target.value;

        if (this.props.onConfigChange) {
            this.props.onConfigChange(changes);
        }
    };

    getIsExplorerIndeterminate = (): boolean => {
        if (!this.props.config.bitbucket.explorer.enabled) {
            return false;
        }

        let count = 0;
        if (this.props.config.bitbucket.explorer.relatedJiraIssues.enabled) {
            count++;
        }
        if (this.props.config.bitbucket.explorer.relatedBitbucketIssues.enabled) {
            count++;
        }
        if (this.props.config.bitbucket.explorer.notifications.pullRequestCreated) {
            count++;
        }

        return count < 3;
    };

    render() {
        return (
            <div>
                <CheckboxField name="pr-explorer-enabled" id="pr-explorer-enabled" value="bitbucket.explorer.enabled">
                    {(fieldArgs: any) => {
                        return (
                            <Checkbox
                                {...fieldArgs.fieldProps}
                                label="Enable Bitbucket pull requests explorer"
                                isIndeterminate={this.getIsExplorerIndeterminate()}
                                onChange={chain(fieldArgs.fieldProps.onChange, this.onCheckboxChange)}
                                isChecked={this.props.config.bitbucket.explorer.enabled}
                            />
                        );
                    }}
                </CheckboxField>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        paddingLeft: '24px'
                    }}
                >
                    <CheckboxField
                        name="pr-explorer-relatedjiraissues-enabled"
                        id="pr-explorer-relatedjiraissues-enabled"
                        value="bitbucket.explorer.relatedJiraIssues.enabled"
                    >
                        {(fieldArgs: any) => {
                            return (
                                <Checkbox
                                    {...fieldArgs.fieldProps}
                                    label="Show related Jira issues for Bitbucket pull requests"
                                    onChange={chain(fieldArgs.fieldProps.onChange, this.onCheckboxChange)}
                                    isDisabled={!this.props.config.bitbucket.explorer.enabled}
                                    isChecked={this.props.config.bitbucket.explorer.relatedJiraIssues.enabled}
                                />
                            );
                        }}
                    </CheckboxField>
                    <CheckboxField
                        name="pr-explorer-relatedbbissues-enabled"
                        id="pr-explorer-relatedbbissues-enabled"
                        value="bitbucket.explorer.relatedBitbucketIssues.enabled"
                    >
                        {(fieldArgs: any) => {
                            return (
                                <Checkbox
                                    {...fieldArgs.fieldProps}
                                    label="Show related Bitbucket issues for pull requests"
                                    onChange={chain(fieldArgs.fieldProps.onChange, this.onCheckboxChange)}
                                    isDisabled={!this.props.config.bitbucket.explorer.enabled}
                                    isChecked={this.props.config.bitbucket.explorer.relatedBitbucketIssues.enabled}
                                />
                            );
                        }}
                    </CheckboxField>
                    <CheckboxField
                        name="pr-explorer-notifications-prcreated"
                        id="pr-explorer-notifications-prcreated"
                        value="bitbucket.explorer.notifications.pullRequestCreated"
                    >
                        {(fieldArgs: any) => {
                            return (
                                <Checkbox
                                    {...fieldArgs.fieldProps}
                                    label="Show notifications when new Bitbucket pull requests are created"
                                    onChange={chain(fieldArgs.fieldProps.onChange, this.onCheckboxChange)}
                                    isDisabled={!this.props.config.bitbucket.explorer.enabled}
                                    isChecked={this.props.config.bitbucket.explorer.notifications.pullRequestCreated}
                                />
                            );
                        }}
                    </CheckboxField>
                    <CheckboxField
                        name="pr-explorer-nest-files-enabled"
                        id="pr-explorer-nest-files-enabled"
                        value="bitbucket.explorer.nestFilesEnabled"
                    >
                        {(fieldArgs: any) => {
                            return (
                                <Checkbox
                                    {...fieldArgs.fieldProps}
                                    label="Nest modified files by folder"
                                    onChange={chain(fieldArgs.fieldProps.onChange, this.onCheckboxChange)}
                                    isDisabled={!this.props.config.bitbucket.explorer.enabled}
                                    isChecked={this.props.config.bitbucket.explorer.nestFilesEnabled}
                                />
                            );
                        }}
                    </CheckboxField>
                </div>
                <div className="refreshInterval">
                    <span>Refresh explorer every: </span>
                    <input
                        className="ac-inputField-inline"
                        style={{ width: '60px' }}
                        name="pr-explorer-refresh-interval"
                        type="number"
                        min="0"
                        value={this.props.config.bitbucket.explorer.refreshInterval}
                        onChange={(e: any) => this.handleNumberChange(e, 'bitbucket.explorer.refreshInterval')}
                        disabled={!this.props.config.bitbucket.explorer.enabled}
                    />
                    <span> minutes (setting to 0 disables auto-refresh)</span>
                </div>
            </div>
        );
    }
}
