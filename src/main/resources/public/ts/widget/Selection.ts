import { Comp } from "./base/Comp";
import { Singletons } from "../Singletons";
import { PubSub } from "../PubSub";
import { Constants } from "../Constants";
import { SelectionOption } from "./SelectionOption";
import { ReactNode } from "react";

let S: Singletons;
PubSub.sub(Constants.PUBSUB_SingletonsReady, (ctx: Singletons) => {
    S = ctx;
});

export class Selection extends Comp {

    //todo-0: do I really want the 'label' passed in the 'attribs' here still? Same question for TextField and other fields?
    constructor(attribs: any, public selectionOptions: Object[] = null, moreClasses: string="") {
        super(attribs || {});
        //w-25 = width 25%
        //https://hackerthemes.com/bootstrap-cheatsheet/#m-1 
        this.attribs.className = "custom-select "+moreClasses; 
        selectionOptions.forEach((row: Object) => {
            if (row['selected']) {
                this.attribs.selection = row['key'];
            }
            this.children.push(new SelectionOption(row['key'], row['val']));
        });
    }

    getSelection = (): string => {
        let elm: HTMLSelectElement = this.getElement() as HTMLSelectElement;
        if (!elm) {
            console.error("getSelection called on element "+this.jsClassName+" before it existed.")
            return null;
        }
        return elm.options[elm.selectedIndex].value;
    }

    setSelection = (key: string) => {
        this.whenElm((elm: HTMLSelectElement) => {
            let idx = -1;
            this.children.forEach((row: SelectionOption) => {
                idx++;
                if (row.key == key) {
                    elm.selectedIndex = idx;
                }
            });
        });
    }

    compRender = (): ReactNode => {
        let children = [];
    
        if (this.attribs.label) {
            children.push(S.e('label', {
                id: this.getId()+"_label",
                key: this.getId()+"_label",
                // className: 'textfield-label', 
                htmlFor: this.getId()
            }, this.attribs.label));
        }

        children.push(this.tagRender('select', null, this.attribs));

        return S.e('div', {
            id: this.getId()+"_sel",
            key: this.getId()+"_sel",
            className: "form-group" //mr-2"
        }, children);
    }
}
