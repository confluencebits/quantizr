import { Comp } from "./base/Comp";
import { Singletons } from "../Singletons";
import { PubSub } from "../PubSub";
import { Constants as C} from "../Constants";
import { CompIntf } from "./base/CompIntf";
import { ReactNode } from "react";

let S: Singletons;
PubSub.sub(C.PUBSUB_SingletonsReady, (ctx: Singletons) => {
    S = ctx;
});

/* General Widget that doesn't fit any more reusable or specific category other than a plain Div, but inherits capability of Comp class */
export class Main extends Comp {

    constructor(attribs: Object = {}, children: CompIntf[] = null) {
        super(attribs);
        this.setChildren(children);
    }

    compRender = (): ReactNode => {
        return this.tagRender('main', null, this.attribs);
    }
}