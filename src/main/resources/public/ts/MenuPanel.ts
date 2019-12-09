console.log("MenuPanel.ts");

import * as I from "./Interfaces";
import { Menu } from "./widget/Menu";
import { MenuItem } from "./widget/MenuItem";
import { Div } from "./widget/Div";
import { Singletons } from "./Singletons";
import { PubSub } from "./PubSub";
import { Constants } from "./Constants";
import { Encryption } from "./Encryption";

let S: Singletons;
PubSub.sub(Constants.PUBSUB_SingletonsReady, (s: Singletons) => {
    S = s;
});

export class MenuPanel extends Div {

    constructor() {
        super(null, {
            id: "accordion",
            role: "tablist"
        });

        this.setChildren([

            new Menu("Site Index", [
                new MenuItem("Your Home Node", S.nav.navHome, () => {
                    return !S.meta64.isAnonUser;
                }),
                new MenuItem("Site Home Node", () => { S.meta64.loadAnonPageHome() }),
                
                //I'm removing my RSS feeds, for now (mainly to remove any political or interest-specific content from the platform)
                //new MenuItem("Podcast Feeds", () => { S.nav.openContentNode("/r/rss"); }),

                new MenuItem("User Guide", () => { S.nav.openContentNode("/r/public/user-guide"); }),
                new MenuItem("Sample Document", () => { S.nav.openContentNode("/r/books/war-and-peace"); }),

                // commenting this only because I don't have the github created yet.
                // new MenuItem("Quantizr on GitHub", S.nav.openGitHubSite),
                
                new MenuItem("Getting Started", () => { S.nav.openContentNode("/r/public/getting-started"); }),
                new MenuItem("Documentation", () => { S.nav.openContentNode("/r/public/subnode-docs"); }),
            ]),
            new Menu("Edit", [
                new MenuItem("Edit", S.edit.runEditNode,
                    () => { return !S.meta64.isAnonUser && S.meta64.state.highlightNode != null && S.meta64.state.selNodeIsMine }), //
                new MenuItem("Create", S.edit.createNode, () => { return S.meta64.state.canCreateNode }), //                
                new MenuItem("Cut", S.edit.cutSelNodes, () => { return !S.meta64.isAnonUser && S.meta64.state.selNodeCount > 0 && S.meta64.state.selNodeIsMine }), //
                new MenuItem("Undo Cut", S.edit.undoCutSelNodes, () => { return !S.meta64.isAnonUser && S.edit.nodesToMove != null }), //
                new MenuItem("Paste Inside", () => { S.edit.pasteSelNodes('inside'); }, () => { return !S.meta64.isAnonUser && S.edit.nodesToMove != null && (S.meta64.state.selNodeIsMine || S.meta64.state.homeNodeSelected) }), //
                new MenuItem("Paste Inline", () => { S.edit.pasteSelNodes('inline'); }, () => { return !S.meta64.isAnonUser && S.edit.nodesToMove != null && (S.meta64.state.selNodeIsMine || S.meta64.state.homeNodeSelected) }), //

                /*
                I have this feature 90% complete but near the end i realized i have a problem with id v.s. uid, because uid
                is only a client-side assigned thing, so i will need to convert my entire 'selectedNodes' over to store
                actual node 'ids' (that long hex value string) to finish this which will take some time.
                */
                //new MenuItem("Select All", S.edit.selectAllNodes, () => { return  !S.meta64.isAnonUser }), //

                new MenuItem("Clear Selections", S.edit.clearSelections, () => { return !S.meta64.isAnonUser && S.meta64.state.selNodeCount > 0 }), //
                new MenuItem("Delete", S.edit.deleteSelNodes, () => { return !S.meta64.isAnonUser && S.meta64.state.selNodeCount > 0 && S.meta64.state.selNodeIsMine; }), //
            ]),
            new Menu("Move", [
                new MenuItem("Move Up", () => { S.edit.moveNodeUp(); }, () => { return S.meta64.state.canMoveUp; }), //
                new MenuItem("Move Down", () => { S.edit.moveNodeDown(); }, () => { return S.meta64.state.canMoveDown; }, () => { return true; }, true), //
                new MenuItem("Move to Top", () => { S.edit.moveNodeToTop(); }, () => { return S.meta64.state.canMoveUp; }), //
                new MenuItem("Move to Bottom", () => { S.edit.moveNodeToBottom(); }, () => { return S.meta64.state.canMoveDown; })//
            ]),
            new Menu("Attach", [
                new MenuItem("Upload from File", S.attachment.openUploadFromFileDlg, () => { return !S.meta64.isAnonUser && S.meta64.state.highlightNode != null && S.meta64.state.selNodeIsMine }), //
                new MenuItem("Upload from URL", S.attachment.openUploadFromUrlDlg, () => { return !S.meta64.isAnonUser && S.meta64.state.highlightNode != null && S.meta64.state.selNodeIsMine }), //
                new MenuItem("Delete Attachment", S.attachment.deleteAttachment, () => {
                    return !S.meta64.isAnonUser && S.meta64.state.highlightNode != null
                        && S.meta64.state.highlightNode.hasBinary && S.meta64.state.selNodeIsMine
                })
            ]),
            new Menu("Share", [
                new MenuItem("Edit Node Sharing", S.share.editNodeSharing, () => { return !S.meta64.isAnonUser && S.meta64.state.highlightNode != null && S.meta64.state.selNodeIsMine }), //
                // new MenuItem("Post Node", () => { S.activityPub.postNode(); },//
                //     () => {
                //         return "ramrod" == S.meta64.userName.toLowerCase() ||
                //             "admin" == S.meta64.userName.toLowerCase();
                //         //!S.meta64.isAnonUser && S.meta64.state.highlightNode != null && S.meta64.state.selNodeIsMine 
                //     }),

                //todo-1: temporarily disabling this during mongo conversion
                //new MenuItem("Find Shared Subnodes", share.findSharedNodes, () => { return  !S.meta64.isAnonUser && S.meta64.state.highlightNode != null })
            ]),
            new Menu("Search", [
                new MenuItem("Content", S.nav.search, () => { return !S.meta64.isAnonUser && S.meta64.state.highlightNode != null }), //
                //new MenuItem("Files", nav.searchFiles, () => { return  !S.meta64.isAnonUser && S.meta64.allowFileSystemSearch },
                //    () => { return  !S.meta64.isAnonUser && S.meta64.allowFileSystemSearch })
            ]),

            //NOTE:Graph feature is fully functional, but not ready to deploy yet.
            // new Menu("Graph", [
            //     new MenuItem("Tree Structure", S.graph.graphTreeStructure, () => { return !S.meta64.isAnonUser && S.meta64.state.highlightNode != null }), //
            // ]),
            new Menu("Timeline", [
                new MenuItem("Created", () => {S.srch.timeline('ctm')}, () => { return !S.meta64.isAnonUser && S.meta64.state.highlightNode != null }), //
                new MenuItem("Modified", () => {S.srch.timeline('mtm')}, () => { return !S.meta64.isAnonUser && S.meta64.state.highlightNode != null }), //
            ]),
            new Menu("View", [
                //todo-1: properties toggle really should be a preferences setting i think, and not a menu option here.
                new MenuItem("Toggle Properties", S.props.propsToggle, () => { return S.meta64.state.propsToggle }, () => { return !S.meta64.isAnonUser }), //
                new MenuItem("Refresh", S.meta64.refresh), //
                new MenuItem("Show URL", S.render.showNodeUrl, () => { return S.meta64.state.highlightNode != null }), //
                new MenuItem("Show Node JSON", () => {S.view.runServerCommand("getJson")}, () => { return S.meta64.isAdminUser }, () => { return S.meta64.isAdminUser }), //
            ]),
            new Menu("Transform", [
                new MenuItem("Split Inline", () => { S.edit.splitNode('inline') }, () => { return !S.meta64.isAnonUser && S.meta64.state.selNodeIsMine; }), //
                new MenuItem("Split to Children", () => { S.edit.splitNode('children') }, () => { return !S.meta64.isAnonUser && S.meta64.state.selNodeIsMine; })
            ]),
            new Menu("Tools",
                [
                    new MenuItem("Import", S.edit.openImportDlg, //
                        () => { return S.meta64.state.importFeatureEnabled && (S.meta64.state.selNodeIsMine || (S.meta64.state.highlightNode != null && S.meta64.homeNodeId == S.meta64.state.highlightNode.id)) },//
                        () => { return S.meta64.state.importFeatureEnabled }), //
                    new MenuItem("Export", S.edit.openExportDlg, //
                        () => { return S.meta64.state.exportFeatureEnabled && (S.meta64.state.selNodeIsMine || (S.meta64.state.highlightNode != null && S.meta64.homeNodeId == S.meta64.state.highlightNode.id)) },
                        () => { return S.meta64.state.exportFeatureEnabled },
                        true//
                    ), //
                    //todo-1: disabled during mongo conversion
                    //new MenuItem("Set Node A", view.setCompareNodeA, () => { return S.meta64.isAdminUser && S.meta64.state.highlightNode != null }, () => { return S.meta64.isAdminUser }), //
                    //new MenuItem("Compare as B (to A)", view.compareAsBtoA, //
                    //    () => { return S.meta64.isAdminUser && S.meta64.state.highlightNode != null }, //
                    //    () => { return S.meta64.isAdminUser }, //
                    //    true
                    //), //
                    //new MenuItem("Generate Hashes", () => { view.processNodeHashes(false); }, () => { return S.meta64.isAdminUser }, () => { return S.meta64.isAdminUser }), //
                    //new MenuItem("Verify Hashes", () => { view.processNodeHashes(true); }, () => { return S.meta64.isAdminUser }, () => { return S.meta64.isAdminUser }), //
                ],
                () => { return S.meta64.isAdminUser; },
                () => { return S.meta64.isAdminUser; }),

            // WORK IN PROGRESS (do not delete)
            // let fileSystemMenuItems = //
            //     menuItem("Reindex", "fileSysReindexButton", "systemfolder.reindex();") + //
            //     menuItem("Search", "fileSysSearchButton", "systemfolder.search();"); //
            //     //menuItem("Browse", "fileSysBrowseButton", "systemfolder.browse();");
            // let fileSystemMenu = makeTopLevelMenu("FileSys", fileSystemMenuItems);

            new Menu("Account", [
                new MenuItem("Preferences", S.edit.editPreferences, () => { return !S.meta64.isAnonUser }), //
                new MenuItem("Change Password", S.edit.openChangePasswordDlg, () => { return !S.meta64.isAnonUser }), //
                new MenuItem("Manage Account", S.edit.openManageAccountDlg, () => { return !S.meta64.isAnonUser }), //
                new MenuItem("Encryption Keys", S.meta64.openManageKeysDlg, () => { return !S.meta64.isAnonUser }), //

                // menuItem("Full Repository Export", "fullRepositoryExport", "
                // S.edit.fullRepositoryExport();") + //
            ]),

            new Menu("IPFS",
                [
                    new MenuItem("Display Node Info", () => {S.view.runServerCommand("ipfsGetNodeInfo")},
                        () => { return S.meta64.isAdminUser || (S.user.isTestUserAccount() && S.meta64.state.selNodeIsMine) },
                        () => { return S.meta64.isAdminUser || (S.user.isTestUserAccount() && S.meta64.state.selNodeIsMine) }
                    ),
                    new MenuItem("Force Refresh", () => {
                        let currentSelNode: I.NodeInfo = S.meta64.getHighlightedNode();
                        let nodeId:string = currentSelNode != null ? currentSelNode.id : null;
                        S.view.refreshTree(nodeId, false, nodeId, false, true);
                    },
                        () => { return S.meta64.isAdminUser || (S.user.isTestUserAccount() && S.meta64.state.selNodeIsMine) },
                        () => { return S.meta64.isAdminUser || (S.user.isTestUserAccount() && S.meta64.state.selNodeIsMine) }
                    ),
                ],
                () => { return S.meta64.isAdminUser; },
                () => { return S.meta64.isAdminUser; }),

            new Menu("Lucene",
                [
                    // new MenuItem("Run Test", () => {S.view.runServerCommand("luceneTest")},
                    //     () => { return S.meta64.isAdminUser },
                    //     () => { return S.meta64.isAdminUser }
                    // ),
                    new MenuItem("Refresh Index", () => {S.view.runServerCommand("refreshLuceneIndex")},
                    () => { return S.meta64.isAdminUser },
                    () => { return S.meta64.isAdminUser }
                ),
                ],
                () => { return S.meta64.isAdminUser; },
                () => { return S.meta64.isAdminUser; }),
                
            new Menu("Admin",
                [
                    //new MenuItem("Graph Display Test", () => {S.view.graphDisplayTest()}, () => { return S.meta64.isAdminUser }, () => { return S.meta64.isAdminUser }), //
                    new MenuItem("Server Info", () => {S.view.runServerCommand("getServerInfo")}, () => { return S.meta64.isAdminUser }, () => { return S.meta64.isAdminUser }), //
                    new MenuItem("Compact DB", () => {S.view.runServerCommand("compactDb")}, () => { return S.meta64.isAdminUser }, () => { return S.meta64.isAdminUser }), //
        
                    new MenuItem("Backup DB", () => {S.view.runServerCommand("BackupDb")}, () => { return S.meta64.isAdminUser }, () => { return S.meta64.isAdminUser }), //
                    new MenuItem("Reset Public Node", () => {S.view.runServerCommand("initializeAppContent")}, () => { return S.meta64.isAdminUser }, () => { return S.meta64.isAdminUser }), //
                    new MenuItem("Insert Book: War and Peace", S.edit.insertBookWarAndPeace,
                        () => { return S.meta64.isAdminUser || (S.user.isTestUserAccount() && S.meta64.state.selNodeIsMine) },
                        () => { return S.meta64.isAdminUser || (S.user.isTestUserAccount() && S.meta64.state.selNodeIsMine) }
                    ),
                   
                    new MenuItem("Rebuild Indexes", S.meta64.rebuildIndexes, () => { return S.meta64.isAdminUser }, () => { return S.meta64.isAdminUser }),
                    new MenuItem("Shutdown Server Node", S.meta64.shutdownServerNode, () => { return S.meta64.isAdminUser }, () => { return S.meta64.isAdminUser }),
                    new MenuItem("Send Test Email", S.meta64.sendTestEmail, () => { return S.meta64.isAdminUser }, () => { return S.meta64.isAdminUser })
                ],
                () => { return S.meta64.isAdminUser; },
                () => { return S.meta64.isAdminUser; })
        ]);
    }
}