import * as I from "../Interfaces";
import * as J from "../JavaIntf";
import { BashPluginIntf } from "../intf/BashPluginIntf";
import { Constants } from "../Constants";
import { Singletons } from "../Singletons";
import { PubSub } from "../PubSub";
import { Button } from "../widget/Button";
import { VerticalLayout } from "../widget/VerticalLayout";
import { TypeHandlerIntf } from "../intf/TypeHandlerIntf";
import { Comp } from "../widget/base/Comp";

let S: Singletons;
PubSub.sub(Constants.PUBSUB_SingletonsReady, (ctx: Singletons) => {
    S = ctx;
});

class BashTypeHandler implements TypeHandlerIntf {
    constructor(private bashPlugin : BashPlugin) {
    }

    render = (node: I.NodeInfo, rowStyling: boolean): Comp => {
        //let content: string = S.props.getNodePropertyVal(Constants.CONTENT, node);
        let name = S.props.getNodePropertyVal(Constants.NAME, node);
        if (!name) {
            name = "[no sn:name prop]";
        }
        let vertLayout = new VerticalLayout([
            // I decided it's better not to display the actual script, here but this code would do that. We could use a collapsable panel
            // like the FileType does.
            // new Pre(content, {
            //     "className":
            //         "bash-script " +
            //         "col-sm-10 " +
            //         "col-md-10" +
            //         "col-lg-10 " +
            //         "col-xl-10 "
            // }),
            new Button(name, () => { this.bashPlugin.executeNodeButton(node) }, {
                className: "bash-exec-button"
            }),
        ]);
        return vertLayout;
    }

    orderProps(node: I.NodeInfo, _props: I.PropertyInfo[]): I.PropertyInfo[] {
        return _props;
    }

    getIconClass(node : I.NodeInfo): string {
        return null;
    }

    allowAction(action : string): boolean {
        return true;
    }
}

export class BashPlugin implements BashPluginIntf {
    bashTypeHandler : TypeHandlerIntf = new BashTypeHandler(this);

    init = () => {
        S.meta64.addTypeHandler("bash", this.bashTypeHandler);
    }

    executeNodeButton = (node: I.NodeInfo): void => {
        S.util.ajax<I.ExecuteNodeRequest, I.ExecuteNodeResponse>("executeNode", {
            "nodeId": node.id,
        }, this.executeNodeResponse);
    }

    private executeNodeResponse = (res: I.ExecuteNodeResponse): void => {
        console.log("ExecuteNodeResponse running.");

        S.util.checkSuccess("Execute Node", res);
        
        //for now not showing a message after. So the scripting can basically just be used to launch an app
        //or something like that where they don't care to see any output.
        //S.util.showMessage(res.output, true, "modal-lg");

        // S.view.refreshTree(null, false);
        // S.meta64.selectTab("mainTab");
        // S.view.scrollToSelectedNode(null);
    }
}
