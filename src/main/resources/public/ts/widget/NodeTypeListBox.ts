console.log("NodeTypeListBox.ts");


import { ListBoxRow } from "./ListBoxRow";
import { Singletons } from "../Singletons";
import { PubSub } from "../PubSub";
import { Constants } from "../Constants";
import { ListBox } from "./ListBox";

let S : Singletons;
PubSub.sub(Constants.PUBSUB_SingletonsReady, (ctx: Singletons) => {
    S = ctx;
});

export class NodeTypeListBox extends ListBox {
    selType: string = "nt:unstructured";
    
    constructor(defaultSel: string, allowFileSysCreate : boolean) {
    
        super({ }, [
            new ListBoxRow("Text/Markdown", () => { this.selType = "nt:unstructured"; }, true),

            /* Note: the isAdminUser is a temporary hack, and there will be a better way to do this eventually (i.e. types themselves
               probably will specify what roles of users they are available on or something like that) */
            new ListBoxRow("RSS Feed", () => { this.selType = "sn:rssfeed"; }, false),
            
            // Experimental types currently disabled;
            //S.meta64.allowBashScripting ? new ListBoxRow("Bash Script", () => { this.selType = "bash"; }, false) : null,
            //new ListBoxRow("Password", () => { this.selType = "sn:passwordType"; }, false),
            !S.meta64.isAdminUser ? null : new ListBoxRow("FileSystem Folder", () => { this.selType = "fs:folder"; }, false),
            !S.meta64.isAdminUser ? null : new ListBoxRow("Lucene Index Folder", () => { this.selType = "luceneIndex"; }, false),
            //new ListBoxRow("IPFS Node", () => { this.selType = "ipfs:node"; }, false),
            //!meta64.isAdminUser ? null : new ListBoxRow("System Folder", () => { this.selType = "meta64:systemfolder"; }, false)
        ]);
    }
}