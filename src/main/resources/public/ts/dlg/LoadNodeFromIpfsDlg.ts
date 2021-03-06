import { AppState } from "../AppState";
import { Constants as C } from "../Constants";
import { DialogBase } from "../DialogBase";
import * as J from "../JavaIntf";
import { PubSub } from "../PubSub";
import { Singletons } from "../Singletons";
import { ValidatedState } from "../ValidatedState";
import { CompIntf } from "../widget/base/CompIntf";
import { Button } from "../widget/Button";
import { ButtonBar } from "../widget/ButtonBar";
import { Form } from "../widget/Form";
import { FormGroup } from "../widget/FormGroup";
import { TextField } from "../widget/TextField";

let S: Singletons;
PubSub.sub(C.PUBSUB_SingletonsReady, (ctx: Singletons) => {
    S = ctx;
});

export class LoadNodeFromIpfsDlg extends DialogBase {

    ipfsPathState: ValidatedState<any> = new ValidatedState<any>();

    constructor(state: AppState) {
        super("Load from IPFS", "app-modal-content-narrow-width", false, state);
    }

    renderDlg(): CompIntf[] {
        return [
            new Form(null, [
                new FormGroup(null, [
                    new TextField("IPFS Path", false, this.load, null, false, this.ipfsPathState)
                ]),
                new ButtonBar([
                    new Button("Load", this.load, null, "btn-primary"),
                    new Button("Close", this.close)
                ])
            ])
        ];
    }

    validate = (): boolean => {
        let valid = true;

        if (!this.ipfsPathState.getValue()) {
            this.ipfsPathState.setError("Cannot be empty.");
            valid = false;
        }
        else {
            this.ipfsPathState.setError(null);
        }
        return valid;
    }

    load = (): void => {
        if (!this.validate()) {
            return;
        }
        let path = this.ipfsPathState.getValue();

        S.util.ajax<J.LoadNodeFromIpfsRequest, J.LoadNodeFromIpfsResponse>("loadNodeFromIpfs", {
            path
        }, (res) => {
            S.util.showMessage(res.message, "Server Reply", true);
        });
    }
}
