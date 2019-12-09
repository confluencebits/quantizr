package org.subnode.mongo.model.types.properties;

import org.subnode.mongo.model.types.intf.SubNodeProperty;

import org.springframework.stereotype.Component;

@Component
public class FileSyncIPFSLink implements SubNodeProperty {

    public String getName() {
        return "ipfs:link";
    }

    public String getType() {
        return "s";
    }
}