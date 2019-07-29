
import { FieldTransformerResult, defaultFieldFilters, UIType, knownSystemSchemas, knownCustomSchemas, multiSelectSchemas, createableSelectSchemas, schemaToUIMap, InputValueType, schemaToInputValueMap, FieldProblem } from "./model/fieldUI";
import { DetailedSiteInfo } from "../../atlclients/authInfo";
import { EpicFieldInfo } from "../jiraCommon";
import { IssueLinkType } from "./model/entities";
import { FieldMeta } from "./model/fieldMetadata";
import { Container } from "../../container";

interface ProblemCollector {
    problems: FieldProblem[];
    hasRequireNonRenderables: boolean;
}

export class FieldTransformer {
    readonly _site: DetailedSiteInfo;

    constructor(site: DetailedSiteInfo) {
        this._site = site;
    }

    public async transformFields(fields: { [k: string]: FieldMeta }, projectKey: string, filterFieldKeys: string[] = defaultFieldFilters, commonFields: string[]): Promise<FieldTransformerResult> {

        const result: FieldTransformerResult = {
            fields: [],
            nonRenderableFields: [],
            hasRequireNonRenderables: false,
        };

        const problemCollector: ProblemCollector = { problems: [], hasRequireNonRenderables: false };
        const epicFieldInfo: EpicFieldInfo = await Container.jiraSettingsManager.getEpicFieldsForSite(this._site);
        const issueLinkTypes: IssueLinkType[] = [];
        const issuelinkTypes = await Container.jiraSettingsManager.getIssueLinkTypes(this._site);

        // if we don't have issueLinkTypes, filter out the issue links
        if (!Array.isArray(issuelinkTypes) || issuelinkTypes.length < 1) {
            filterFieldKeys.push('issuelinks');
        }

        // transform the fields
        Object.keys(fields).forEach(k => {
            const field: FieldMeta = fields[k];
            if (field && !this.shouldFilter(field, filterFieldKeys, problemCollector)) {
                result.fields.push(this.transformField(field, projectKey, commonFields, epicFieldInfo, issueLinkTypes));
            }
        });

        result.nonRenderableFields = problemCollector.problems;
        result.hasRequireNonRenderables = problemCollector.hasRequireNonRenderables;

        return result;
    }

    private transformField(field: FieldMeta, projectKey: string, commonFields: string[], epicFieldInfo: EpicFieldInfo, issueLinkTypes: IssueLinkType[]): any {
        switch (this.uiTypeForField(field.schema)) {
            case UIType.Input: {
                return {
                    required: field.required,
                    name: field.name,
                    key: field.key,
                    uiType: UIType.Input,
                    valueType: this.inputValueTypeForField(field.schema),
                    advanced: this.isAdvanced(field, commonFields)
                };
            }
            case UIType.Textarea: {
                return {
                    required: field.required,
                    name: field.name,
                    key: field.key,
                    uiType: UIType.Textarea,
                    advanced: this.isAdvanced(field, commonFields)
                };
            }
            case UIType.Checkbox: {
                return {
                    required: field.required,
                    name: field.name,
                    key: field.key,
                    uiType: UIType.Checkbox,
                    allowedValues: (field.allowedValues !== undefined) ? field.allowedValues : [],
                    advanced: this.isAdvanced(field, commonFields)
                };
            }
            case UIType.Radio: {
                return {
                    required: field.required,
                    name: field.name,
                    key: field.key,
                    uiType: UIType.Radio,
                    allowedValues: (field.allowedValues !== undefined) ? field.allowedValues : [],
                    advanced: this.isAdvanced(field, commonFields)
                };
            }
            case UIType.Date: {
                return {
                    required: field.required,
                    name: field.name,
                    key: field.key,
                    uiType: UIType.Date,
                    advanced: this.isAdvanced(field, commonFields)
                };
            }
            case UIType.DateTime: {
                return {
                    required: field.required,
                    name: field.name,
                    key: field.key,
                    uiType: UIType.DateTime,
                    advanced: this.isAdvanced(field, commonFields)
                };
            }
            case UIType.User: {
                return {
                    required: field.required,
                    name: field.name,
                    key: field.key,
                    uiType: UIType.User,
                    isMulti: (field.schema && field.schema.custom === 'com.atlassian.jira.plugin.system.customfieldtypes:multiuserpicker') ? true : false,
                    advanced: this.isAdvanced(field, commonFields)
                };
            }
            case UIType.Select: {
                let allowedValues = (field.allowedValues !== undefined) ? field.allowedValues : [];
                let autoCompleteJql = '';

                if (field.key === epicFieldInfo.epicLink.id) {
                    autoCompleteJql = `project = "${projectKey}" and cf[${epicFieldInfo.epicName.cfid}] != ""  and resolution = EMPTY`;
                }

                return {
                    required: field.required,
                    name: field.name,
                    key: field.key,
                    uiType: UIType.Select,
                    allowedValues: allowedValues,
                    isMulti: this.isMultiSelect(field.schema),
                    isCascading: (field.schema.custom === 'com.atlassian.jira.plugin.system.customfieldtypes:cascadingselect') ? true : false,
                    isCreateable: this.isCreateableSelect(field.schema),
                    autoCompleteUrl: (field.autoCompleteUrl !== undefined) ? field.autoCompleteUrl : '',
                    autoCompleteJql: autoCompleteJql,
                    advanced: this.isAdvanced(field, commonFields)
                };
            }
            case UIType.IssueLink: {
                return {
                    required: field.required,
                    name: field.name,
                    key: field.key,
                    uiType: UIType.IssueLink,
                    autoCompleteUrl: (field.autoCompleteUrl !== undefined) ? field.autoCompleteUrl : '',
                    allowedValues: issueLinkTypes,
                    isCreateable: true,
                    isMulti: this.isMultiSelect(field.schema),
                    advanced: this.isAdvanced(field, commonFields)
                };
            }
            case UIType.Timetracking: {
                return {
                    required: field.required,
                    name: field.name,
                    key: field.key,
                    uiType: UIType.Timetracking,
                    advanced: this.isAdvanced(field, commonFields)
                };
            }
            case UIType.Worklog: {
                return {
                    required: field.required,
                    name: field.name,
                    key: field.key,
                    uiType: UIType.Worklog,
                    advanced: this.isAdvanced(field, commonFields)
                };
            }
            case UIType.Attachment: {
                return {
                    required: field.required,
                    name: field.name,
                    key: field.key,
                    uiType: UIType.Attachment,
                    advanced: this.isAdvanced(field, commonFields)
                };
            }
        }
    }

    private shouldFilter(field: FieldMeta, filters: string[], collector: ProblemCollector): boolean {
        if (filters.includes(field.key)) {
            return true;
        }

        if (((field.schema.system !== undefined && !knownSystemSchemas.includes(field.schema.system))
            || (field.schema.custom !== undefined && !knownCustomSchemas.includes(field.schema.custom)))) {
            let schema = field.schema.system !== undefined ? field.schema.system : field.schema.custom;
            if (!schema) {
                schema = "unknown schema";
            }

            const msg = field.required ? "required field contains non-renderable schema" : "field contains non-renderable schema";
            this.addFieldProblem({
                key: field.key,
                name: field.name,
                required: field.required,
                message: msg,
                schema: schema
            }, collector);

            return true;
        }

        return false;
    }

    private isAdvanced(field: FieldMeta, commonFields: string[]): boolean {
        return (!commonFields.includes(field.key) && !field.required);
    }

    private isMultiSelect(schema: { type: string, system?: string, custom?: string }): boolean {
        if (
            (schema.system && multiSelectSchemas.includes(schema.system))
            || (schema.custom && multiSelectSchemas.includes(schema.custom))) {
            return true;
        }

        return false;
    }

    private isCreateableSelect(schema: { type: string, system?: string, custom?: string }): boolean {
        if (
            (schema.system && createableSelectSchemas.includes(schema.system))
            || (schema.custom && createableSelectSchemas.includes(schema.custom))) {
            return true;
        }

        return false;
    }

    private uiTypeForField(schema: { type: string, system?: string, custom?: string }): UIType {
        if (schema.system && schemaToUIMap.has(schema.system)) {
            return schemaToUIMap.get(schema.system)!;
        }

        if (schema.custom && schemaToUIMap.has(schema.custom)) {
            return schemaToUIMap.get(schema.custom)!;
        }

        return UIType.Input;
    }

    private inputValueTypeForField(schema: { type: string, system?: string, custom?: string }): InputValueType {
        if (schema.system && schemaToInputValueMap.has(schema.system)) {
            return schemaToInputValueMap.get(schema.system)!;
        }

        if (schema.custom && schemaToInputValueMap.has(schema.custom)) {
            return schemaToInputValueMap.get(schema.custom)!;
        }

        return InputValueType.String;
    }

    private addFieldProblem(problem: FieldProblem, collector: ProblemCollector) {

        let alreadyFound = collector.problems.find(p => p.key === problem.key);

        if (!alreadyFound) {
            collector.problems.push(problem);
            if (problem.required) {
                collector.hasRequireNonRenderables = true;
            }
        }
    }
}