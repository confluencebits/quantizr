package org.subnode.mongo;

import org.apache.commons.codec.digest.DigestUtils;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.mapping.event.AbstractMongoEventListener;
import org.springframework.data.mongodb.core.mapping.event.AfterConvertEvent;
import org.springframework.data.mongodb.core.mapping.event.AfterLoadEvent;
import org.springframework.data.mongodb.core.mapping.event.AfterSaveEvent;
import org.springframework.data.mongodb.core.mapping.event.BeforeDeleteEvent;
import org.springframework.data.mongodb.core.mapping.event.BeforeSaveEvent;
import org.subnode.config.NodeName;
import org.subnode.exception.base.RuntimeEx;
import org.subnode.model.client.NodeProp;
import org.subnode.mongo.model.SubNode;
import org.subnode.service.ActPubService;
import org.subnode.util.XString;

public class MongoEventListener extends AbstractMongoEventListener<SubNode> {

	private static final Logger log = LoggerFactory.getLogger(MongoEventListener.class);

	@Autowired
	private MongoRead read;

	@Autowired
	private ActPubService actPub;

	/*
	 * todo-2: This is a temporary hack to allow our ExportJsonService.resetNode importer to work. This
	 * is importing nodes that should be all self contained as a directed graph and there's no risk if
	 * nodes without parents, but they MAY be out of order so that the children of some nodes may appear
	 * in the JSON being imported BEFORE their parents (which would cause the parent check to fail, up
	 * until the full node graph has been imported), and so I'm creating this hack to globally disable
	 * the check during the import only.
	 */
	public static boolean parentCheckEnabled = false;

	/**
	 * What we are doing in this method is assigning the ObjectId ourselves, because our path must
	 * include this id at the very end, since the path itself must be unique. So we assign this prior to
	 * persisting so that when we persist everything is perfect.
	 * 
	 * WARNING: updating properties on 'node' in here has NO EFFECT. Always update dbObj only!
	 */
	@Override
	public void onBeforeSave(BeforeSaveEvent<SubNode> event) {
		SubNode node = event.getSource();
		// log.debug("MONGO SAVE EVENT: "+XString.prettyPrint(node));

		Document dbObj = event.getDocument();
		ObjectId id = node.getId();

		/*
		 * Note: There's a special case in MongoApi#createUser where the new User root node ID is assigned
		 * there, along with setting that on the owner property so we can do one save and have both updated
		 */
		if (id == null) {
			id = new ObjectId();
			node.setId(id);
			// log.debug("New Node ID generated: " + id);
		}
		dbObj.put(SubNode.FIELD_ID, id);

		// log.debug("onBeforeSave: ID: " + node.getId().toHexString());

		// DO NOT DELETE
		/*
		 * If we ever add a unique-index for "Name" (not currently the case), then we'd need something like
		 * this to be sure each node WOULD have a unique name.
		 */
		// if (StringUtils.isEmpty(node.getName())) {
		// node.setName(id.toHexString())
		// }

		/* if no owner is assigned... */
		if (node.getOwner() == null) {

			/* if we are saving the root node, we make it be the owner of itself */
			if (node.getPath().equals("/" + NodeName.ROOT)) {
				dbObj.put(SubNode.FIELD_OWNER, id);
				node.setOwner(id);
			}
			/* otherwise we have a problem, because we require an owner always */
			else {
				throw new RuntimeEx("Attempted to save node with no owner: " + XString.prettyPrint(node));
			}
		}

		if (parentCheckEnabled) {
			read.checkParentExists(null, node);
		}

		/*
		 * New nodes can be given a path where they will allow the ID to play the role of the leaf 'name'
		 * part of the path
		 */
		if (node.getPath().endsWith("/?")) {
			// Note: Any code here prior to 11/6/2020, did NOT have the last path part as
			// the ID, but was
			// instad a function of the hash of the ID.
			String path = XString.removeLastChar(node.getPath()) + id.toHexString();
			dbObj.put(SubNode.FIELD_PATH, path);
			node.setPath(path);
		}

		String pathHash = DigestUtils.sha256Hex(node.getPath());
		// log.debug("CHECK PathHash=" + pathHash);

		if (!pathHash.equals(node.getPathHash())) {
			dbObj.put(SubNode.FIELD_PATH_HASH, pathHash);
			node.setPathHash(pathHash);
			// log.debug("RESET PathHash=" + pathHash);
		}

		/* Node name not allowed to contain : or ~ */
		String nodeName = node.getName();
		if (nodeName != null) {

			nodeName = nodeName.replaceAll(":", "-");
			nodeName = nodeName.replaceAll("~", "-");
			nodeName = nodeName.replaceAll("/", "-");

			// Warning: this is not a redundant null check. Some code in this block CAN set
			// to null.
			if (nodeName != null) {
				dbObj.put(SubNode.FIELD_NAME, nodeName);
				node.setName(nodeName);
			}
		}

		removeDefaultProps(node);

		if (node.getAc() != null) {
			/* we need to ensure that we never save an empty Acl, but null instead, because some parts of the code
			assume that if the AC is non-null then there ARE some shares on the node.

			This 'fix' only started being necessary I think once I added the safeGetAc, and that check ends up causing
			the AC to contain an empty object sometimes */
			if (node.getAc().size() == 0) {
				node.setAc(null);
				dbObj.put(SubNode.FIELD_AC, null);
			}
			// Remove any share to self because that never makes sense
			else if (node.getAc().remove(node.getOwner().toHexString()) != null) {
				dbObj.put(SubNode.FIELD_AC, node.getAc());
			}
		}
	}

	/*
	 * For properties that are being set to their default behaviors as if the property didn't exist
	 * (such as vertical layout is assumed if no layout property is specified) we remove those
	 * properties when the client is passing them in to be saved, or from any other source they are
	 * being passed to be saved
	 */
	public void removeDefaultProps(SubNode node) {

		/* If layout=="v" then remove the property */
		String layout = node.getStrProp(NodeProp.LAYOUT.s());
		if ("v".equals(layout)) {
			node.deleteProp(NodeProp.LAYOUT.s());
		}

		/* If priority=="0" then remove the property */
		String priority = node.getStrProp(NodeProp.PRIORITY.s());
		if ("0".equals(priority)) {
			node.deleteProp(NodeProp.PRIORITY.s());
		}
	}

	@Override
	public void onAfterSave(AfterSaveEvent<SubNode> event) {
		// SubNode node = event.getSource();
	}

	@Override
	public void onAfterLoad(AfterLoadEvent<SubNode> event) {
		// Document dbObj = event.getDocument();
		// log.debug("onAfterLoad:
		// id="+dbObj.getObjectId(SubNode.FIELD_ID).toHexString());
	}

	@Override
	public void onAfterConvert(AfterConvertEvent<SubNode> event) {
		// Document dbObj = event.getDocument();
		// ObjectId id = dbObj.getObjectId(SubNode.FIELD_ID);
	}

	@Override
	public void onBeforeDelete(BeforeDeleteEvent<SubNode> event) {
		Document doc = event.getDocument();
		if (doc != null) {
			Object val = doc.get("_id");
			if (val instanceof ObjectId) {
				actPub.deleteNodeNotify((ObjectId) val);
			}
		}
	}
}
