import { useSelector } from "react-redux";
import { dispatch, store } from "../AppRedux";
import { AppState } from "../AppState";
import { Constants as C } from "../Constants";
import * as J from "../JavaIntf";
import { PubSub } from "../PubSub";
import { Singletons } from "../Singletons";
import { ValidatedState } from "../ValidatedState";
import { Comp } from "../widget/base/Comp";
import { Button } from "../widget/Button";
import { ButtonBar } from "../widget/ButtonBar";
import { Checkbox } from "../widget/Checkbox";
import { CollapsibleHelpPanel } from "../widget/CollapsibleHelpPanel";
import { Div } from "../widget/Div";
import { Heading } from "../widget/Heading";
import { IconButton } from "../widget/IconButton";
import { Span } from "../widget/Span";
import { TextField } from "../widget/TextField";

let S: Singletons;
PubSub.sub(C.PUBSUB_SingletonsReady, (ctx: Singletons) => {
    S = ctx;
});

/* General Widget that doesn't fit any more reusable or specific category other than a plain Div, but inherits capability of Comp class */
export class FeedView extends Div {

    static searchTextState: ValidatedState<any> = new ValidatedState<any>();

    // I don't like this OR how much CPU load it takes, so I'm flagging it off for now
    realtimeCheckboxes: boolean = false;

    static page: number = 0;
    static helpExpanded: boolean = false;

    constructor() {
        super(null, {
            id: "feedTab"
        });
    }

    preRender(): void {
        let state: AppState = useSelector((state: AppState) => state);
        this.attribs.className = "tab-pane fade my-tab-pane";
        if (state.activeTab === this.getId()) {
            this.attribs.className += " show active";
        }

        /*
         * Number of rows that have actually made it onto the page to far. Note: some nodes get filtered out on the
         * client side for various reasons.
         */
        let rowCount = 0;
        let children: Comp[] = [];

        let refreshFeedButtonBar = new ButtonBar([
            state.isAnonUser ? null : new Button("New Post", () => S.edit.addComment(null, state), { title: "Post something awesome on the Fediverse!" }, "btn-primary"),
            state.isAnonUser ? null : new Button("Friends", () => S.nav.openContentNode("~" + J.NodeType.FRIEND_LIST, state), { title: "Manage your list of frenz!" }),
            new Span(null, {
                className: ((state.feedDirty || state.feedWaitingForUserRefresh) ? "feedDirtyButton" : "feedNotDirtyButton")
            }, [
                new Button("Refresh Feed" + (state.feedDirty ? " (New Posts)" : ""), () => {
                    FeedView.page = 0;
                    dispatch({
                        type: "Action_SetFeedFilterType",
                        update: (s: AppState): void => {
                            s.feedLoading = true;
                        }
                    });

                    S.srch.feed("~" + J.NodeType.FRIEND_LIST, null, FeedView.page, FeedView.searchTextState.getValue());
                })
            ])
        ], null, "float-right marginBottom");

        children.push(this.makeFilterButtonsBar(state));
        children.push(refreshFeedButtonBar);
        children.push(new Div(null, { className: "clearfix" }));

        let helpPanel = new CollapsibleHelpPanel("Help",
            "This is your Fediverse <b>feed</b> that shows a reverse chronological stream of posts from people you Follow.<p>" +
            "Use the 'Friends' button to jump over to the part of your main tree where your Friends List is stored to manage your friends.<p>" +
            "Use any 'Jump' button in the feed to go the the main content tree location of that post. Unlike other social media apps " +
            "this platform stores all content on a Tree Structure, so in addition to appearing in the Feed, all nodes have a more permanent location on this large global tree." +
            "<p>" +
            "<h4>Filter Options</h4>" +
            "Friends &rarr; Includes your Friends <br>" +
            "To Me &rarr; Includes nodes shared to you by name <br>" +
            "From Me &rarr; Includes nodes you created <br>" +
            "Fediverse &rarr; Includes nodes that are shared to everyone (public sharing) <br>" +
            "NSFW &rarr; Includes nodes flagged as 'sensitive' or potentially offensive or NSFW"
            ,
            (state: boolean) => {
                FeedView.helpExpanded = state;
            }, FeedView.helpExpanded);

        let searchPanel = new TextField("Search", false, null, "feedSearchField float-right", false, FeedView.searchTextState);
        children.push(searchPanel);

        if (state.feedLoading) {
            children.push(new Heading(4, "Loading feed..."));
        }
        else if (state.feedWaitingForUserRefresh) {
            children.push(new Div("Make selections, then 'Refresh Feed'"));
        }
        else if (!state.feedResults || state.feedResults.length === 0) {
            children.push(new Div("Nothing to display."));
        }
        else {
            let i = 0;
            let childCount = state.feedResults.length;
            state.feedResults.forEach((node: J.NodeInfo) => {
                // console.log("FEED: node id=" + node.id + " content: " + node.content);
                S.srch.initSearchNode(node);
                children.push(S.srch.renderSearchResultAsListItem(node, i, childCount, rowCount, "feed", true, false, true, state));
                i++;
                rowCount++;
            });

            if (rowCount > 0 && !state.feedEndReached) {
                children.push(new ButtonBar([
                    new IconButton("fa-angle-right", "More", {
                        onClick: () => S.srch.feed("~" + J.NodeType.FRIEND_LIST, null, ++FeedView.page, FeedView.searchTextState.getValue()),
                        title: "Next Page"
                    })], "text-center marginTop marginBottom"));
            }
        }

        children.push(helpPanel);

        this.setChildren(children);
    }

    makeFilterButtonsBar = (state: AppState): Span => {
        return new Span(null, { className: "checkboxBar" }, [
            state.isAnonUser ? null : new Checkbox("Friends", {
                title: "Include Nodes posted by your friends"
            }, {
                setValue: (checked: boolean): void => {
                    dispatch({
                        type: "Action_SetFeedFilterType",
                        update: (s: AppState): void => {
                            s.feedWaitingForUserRefresh = !this.realtimeCheckboxes;
                            s.feedFilterFriends = checked;
                        }
                    });

                    if (this.realtimeCheckboxes) {
                        FeedView.page = 0;
                        S.srch.feed("~" + J.NodeType.FRIEND_LIST, null, FeedView.page, FeedView.searchTextState.getValue());
                    }
                },
                getValue: (): boolean => {
                    return store.getState().feedFilterFriends;
                }
            }),

            state.isAnonUser ? null : new Checkbox("To Me", {
                title: "Include Nodes shares specifically to you"
            }, {
                setValue: (checked: boolean): void => {
                    dispatch({
                        type: "Action_SetFeedFilterType",
                        update: (s: AppState): void => {
                            s.feedWaitingForUserRefresh = !this.realtimeCheckboxes;
                            s.feedFilterToMe = checked;
                        }
                    });

                    if (this.realtimeCheckboxes) {
                        FeedView.page = 0;
                        S.srch.feed("~" + J.NodeType.FRIEND_LIST, null, FeedView.page, FeedView.searchTextState.getValue());
                    }
                },
                getValue: (): boolean => {
                    return store.getState().feedFilterToMe;
                }
            }),
            state.isAnonUser ? null : new Checkbox("From Me", {
                title: "Include Nodes created by you"
            }, {
                setValue: (checked: boolean): void => {
                    dispatch({
                        type: "Action_SetFeedFilterType",
                        update: (s: AppState): void => {
                            s.feedWaitingForUserRefresh = !this.realtimeCheckboxes;
                            s.feedFilterFromMe = checked;
                        }
                    });

                    if (this.realtimeCheckboxes) {
                        FeedView.page = 0;
                        S.srch.feed("~" + J.NodeType.FRIEND_LIST, null, FeedView.page, FeedView.searchTextState.getValue());
                    }
                },
                getValue: (): boolean => {
                    return store.getState().feedFilterFromMe;
                }
            }),
            state.isAnonUser ? null : new Checkbox("Fediverse", {
                title: "Include Nodes shared to 'Public' (everyone)"
            }, {
                setValue: (checked: boolean): void => {
                    dispatch({
                        type: "Action_SetFeedFilterType",
                        update: (s: AppState): void => {
                            s.feedWaitingForUserRefresh = !this.realtimeCheckboxes;
                            s.feedFilterToPublic = checked;
                        }
                    });

                    if (this.realtimeCheckboxes) {
                        FeedView.page = 0;
                        S.srch.feed("~" + J.NodeType.FRIEND_LIST, null, FeedView.page, FeedView.searchTextState.getValue());
                    }
                },
                getValue: (): boolean => {
                    return store.getState().feedFilterToPublic;
                }
            }),
            new Checkbox("NSFW", {
                title: "Include NSFW Content (Allows material flagged as 'Sensitive')"
            }, {
                setValue: (checked: boolean): void => {
                    dispatch({
                        type: "Action_SetFeedFilterType",
                        update: (s: AppState): void => {
                            s.feedWaitingForUserRefresh = !this.realtimeCheckboxes;
                            s.feedFilterNSFW = checked;
                        }
                    });

                    if (this.realtimeCheckboxes) {
                        FeedView.page = 0;
                        S.srch.feed("~" + J.NodeType.FRIEND_LIST, null, FeedView.page, FeedView.searchTextState.getValue());
                    }
                },
                getValue: (): boolean => {
                    return store.getState().feedFilterNSFW;
                }
            })
        ]);
    }
}
