console.log("CreateNodeDlg.ts");

import { DialogBase } from "../DialogBase";
import { ButtonBar } from "../widget/ButtonBar";
import { Button } from "../widget/Button";
import { Form } from "../widget/Form";
import { Constants } from "../Constants";
import { Singletons } from "../Singletons";
import { PubSub } from "../PubSub";
import { Checkbox } from "../widget/Checkbox";
import { VerticalLayout } from "../widget/VerticalLayout";
import { EncryptionOptions } from "../EncryptionOptions";

let S: Singletons;
PubSub.sub(Constants.PUBSUB_SingletonsReady, (ctx: Singletons) => {
    S = ctx;
});

/**
 * Dialog to let user configure encryption for a node. 
 */
export class EncryptionDlg extends DialogBase {

    encryptAsPrivate: Checkbox;
  
    constructor(public encryptionOptions: EncryptionOptions) {
        super("Node Encryption");

        this.setChildren([
            new Form(null, [
                new VerticalLayout([
                    this.encryptAsPrivate = new Checkbox("Encrypt as Private (only you can read)", this.encryptionOptions.encryptForOwnerOnly),
                ]),
                new ButtonBar([
                    new Button("Save", () => {
                        this.save();
                        this.close();
                    }),
                    new Button("Cancel", () => {
                        this.close();
                    })
                ])
            ])
        ]);
    }

    save = (): void => {
        this.encryptionOptions.encryptForOwnerOnly = this.encryptAsPrivate.getChecked();
    }
}