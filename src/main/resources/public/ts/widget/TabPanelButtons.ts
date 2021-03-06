import { useSelector } from "react-redux";
import { dispatch } from "../AppRedux";
import { AppState } from "../AppState";
import { Constants as C } from "../Constants";
import { PubSub } from "../PubSub";
import { Singletons } from "../Singletons";
import { Anchor } from "./Anchor";
import { Div } from "./Div";
import { Li } from "./Li";
import { Ul } from "./Ul";

let S: Singletons;
PubSub.sub(C.PUBSUB_SingletonsReady, (s: Singletons) => {
    S = s;
});

export class TabPanelButtons extends Div {

    constructor() {
        super(null);
    }

    preRender(): void {
        let state: AppState = useSelector((state: AppState) => state);
        let searchResults = state.searchResults;
        let timelineResults = state.timelineResults;
        let searchDisplay = searchResults ? "inline" : "none";
        let timelineDisplay = timelineResults ? "inline" : "none";
        let feedDisplay = "inline";

        // the row of buttons that ARE the tabs where you click to change tabs.
        let tabButtons = new Div(null, {
            className: "tab-buttons-container"
        }, [
            new Ul(null, {
                // append 'flex-column' to className for vertical buttons
                className: "nav nav-tabs",
                id: "navTabs"
            },
                /* These 'li' (list item) elements hold the tab bar that goes across the top of every page */
                [new Li(null, {
                    className: "nav-item navItem"
                    // style: { display: mainDisplay }
                }, [
                    new Anchor("#mainTab", "Main", {
                        "data-toggle": "tab",
                        className: "nav-link" + (state.activeTab === "mainTab" ? " active" : ""),
                        onClick: () => {
                            S.meta64.selectTab("mainTab");
                        }
                    })]
                ),

                new Li(null, {
                    className: "nav-item navItem",
                    style: { display: searchDisplay }
                },
                    [new Anchor("#searchTab", "Search", {
                        "data-toggle": "tab",
                        className: "nav-link" + (state.activeTab === "searchTab" ? " active" : ""),
                        onClick: () => {
                            S.meta64.selectTab("searchTab");
                        }
                    })]
                ),

                new Li(null, {
                    className: "nav-item navItem",
                    style: { display: timelineDisplay }
                },
                    [new Anchor("#timelineTab", "Timeline", {
                        "data-toggle": "tab",
                        className: "nav-link" + (state.activeTab === "timelineTab" ? " active" : ""),
                        onClick: () => {
                            S.meta64.selectTab("timelineTab");
                        }
                    })]
                ),

                new Li(null, {
                    className: "nav-item navItem",
                    style: { display: feedDisplay }
                },
                    [new Anchor("#feedTab", "Feed", {
                        "data-toggle": "tab",
                        className: "nav-link" + (state.activeTab === "feedTab" ? " active" : ""),
                        onClick: () => {
                            S.meta64.selectTab("feedTab");
                        }
                    })]
                )]
            )]
        );

        this.setChildren([
            tabButtons
        ]);
    }
}
