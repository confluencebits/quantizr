import { ReactNode } from "react";

export type ReactRenderFunc = (type: any, props: any, children: React.ReactNode[]) => React.ReactNode;

export interface CompIntf {
    clazz: string;

    setIsEnabledFunc(isEnabledFunc: Function); 
    setIsVisibleFunc(isVisibleFunc: Function);
    
    getId(): string;
    getElement(): HTMLElement; 
    whenElm(func: Function); 
    whenElmEx(func: Function); 
    setVisible(visible: boolean); 
    setState(newState: any): void;
    mergeState(moreState: any): any;
    setEnabled(enabled: boolean);
    setClass(clazz: string): void; 
    reactRenderHtmlInDiv(type: any): string;
    reactRenderHtmlInSpan(type: any): string;
    updateDOM(store: any, id: string): void;
    setInnerHTML(html: string); 
    getAttribs() : Object;
    compRender(): ReactNode;
    forceRender(): void;
}
