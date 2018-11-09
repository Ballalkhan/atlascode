import { Message } from "./messaging";
import { JiraIssue } from "../jira/jiraIssue";

// IssueData is the message that gets sent to the JiraIssuePage react view containing the issue details.
// we simply use the same name with two extend statements to merge the multiple interfaces
export interface IssueData extends Message {}
export interface IssueData extends JiraIssue.Issue {}