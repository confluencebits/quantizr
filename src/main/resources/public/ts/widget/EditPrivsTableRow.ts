import { Comp } from "./base/Comp";
import * as I from "../Interfaces";
import * as J from "../JavaIntf";
import { Div } from "./Div";
import { Button } from "./Button";
import { TextContent } from "./TextContent";
import { Singletons } from "../Singletons";
import { PubSub } from "../PubSub";
import { Constants } from "../Constants";
import { Heading } from "./Heading";
import { ReactNode } from "react";

let S: Singletons;
PubSub.sub(Constants.PUBSUB_SingletonsReady, (ctx: Singletons) => {
    S = ctx;
});

export class EditPrivsTableRow extends Comp {

    constructor(public aclEntry: I.AccessControlEntryInfo, private removePrivilege: (principalNodeId: string, privilege: string) => void) {
        super(null);
        this.setClass("list-group-item list-group-item-action");

        this.addChild(new Heading(4, "User: " + this.aclEntry.principalName));
        this.addChild(this.renderAclPrivileges(this.aclEntry));
    }

    renderAclPrivileges = (aclEntry: I.AccessControlEntryInfo): Div => {

        let div = new Div();
        aclEntry.privileges.forEach((privilege, index) => {
            div.addChild(new Button("Remove", () => {
                this.removePrivilege(aclEntry.principalNodeId, privilege.privilegeName);
            }));
            div.addChild(new TextContent(aclEntry.principalName + " has privilege " + privilege.privilegeName + " on this node."));
        });
        return div;
    }

    compRender = (): ReactNode => {
        return this.tagRender('div', null, this.attribs);
    }
}
