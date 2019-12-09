package org.subnode.service;

import java.util.List;

import org.subnode.mongo.MongoApi;
import org.subnode.mongo.MongoSession;
import org.subnode.mongo.model.SubNode;
import org.subnode.mongo.model.types.AllSubNodeTypes;
import org.subnode.request.DeleteNodesRequest;
import org.subnode.request.MoveNodesRequest;
import org.subnode.request.SelectAllNodesRequest;
import org.subnode.request.SetNodePositionRequest;
import org.subnode.response.DeleteNodesResponse;
import org.subnode.response.MoveNodesResponse;
import org.subnode.response.SelectAllNodesResponse;
import org.subnode.response.SetNodePositionResponse;
import org.subnode.util.ThreadLocals;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * Service for controlling the positions (ordinals) of nodes relative to their parents and/or moving
 * nodes to locate them under a different parent. This is similar type of functionality to
 * cut-and-paste in file systems. Currently there is no way to 'clone' or copy nodes, but user can
 * move any existing nodes they have to any new location they want, subject to security constraints
 * of course.
 */
@Component
public class NodeMoveService {
	private static final Logger log = LoggerFactory.getLogger(NodeMoveService.class);

	@Autowired
	private MongoApi api;

	@Autowired
	private AllSubNodeTypes TYPES;
	/*
	 * Moves the the node to a new ordinal/position location (relative to parent)
	 *
	 * We allow the special case of req.siblingId="[topNode]" and that indicates move the node to be
	 * the first node under its parent.
	 */
	public void setNodePosition(MongoSession session, SetNodePositionRequest req, SetNodePositionResponse res) {
		if (session == null) {
			session = ThreadLocals.getMongoSession();
		}

		String nodeId = req.getNodeId();

		SubNode node = api.getNode(session, nodeId);
		if (node == null) {
			throw new RuntimeException("Node not found: " + nodeId);
		}

		if ("up".equals(req.getTargetName())) {
			moveNodeUp(session, node);
		} else if ("down".equals(req.getTargetName())) {
			moveNodeDown(session, node);
		} else if ("top".equals(req.getTargetName())) {
			moveNodeToTop(session, node);
		} else if ("bottom".equals(req.getTargetName())) {
			moveNodeToBottom(session, node);
		} else {
			throw new RuntimeException("Invalid target type: " + req.getTargetName());
		}

		res.setSuccess(true);
	}

	public void moveNodeUp(MongoSession session, SubNode node) {
		SubNode nodeAbove = api.getSiblingAbove(session, node);
		if (nodeAbove != null) {
			Long saveOrdinal = nodeAbove.getOrdinal();
			nodeAbove.setOrdinal(node.getOrdinal());
			node.setOrdinal(saveOrdinal);
		}
		api.saveSession(session);
	}

	public void moveNodeDown(MongoSession session, SubNode node) {
		SubNode nodeBelow = api.getSiblingBelow(session, node);
		if (nodeBelow != null) {
			Long saveOrdinal = nodeBelow.getOrdinal();
			nodeBelow.setOrdinal(node.getOrdinal());
			node.setOrdinal(saveOrdinal);
		}
		api.saveSession(session);
	}

	public void moveNodeToTop(MongoSession session, SubNode node) {
		SubNode parentNode = api.getParent(session, node);
		if (parentNode == null) {
			return;
		}
		api.insertOrdinal(session, parentNode, 0L, 1L);

		// todo-2: there is a slight ineffieiency here in that 'node' does end up getting saved
		// both as part of the insertOrdinal, and also then with the setting of it to zero. Will be
		// easy to fix when I get to it, but is low priority for now.
		api.saveSession(session);

		node.setOrdinal(0L);
		api.saveSession(session);
	}

	public void moveNodeToBottom(MongoSession session, SubNode node) {
		SubNode parentNode = api.getParent(session, node);
		if (parentNode == null) {
			return;
		}
		long ordinal = api.getMaxChildOrdinal(session, parentNode) + 1L;
		node.setOrdinal(ordinal);
		parentNode.setMaxChildOrdinal(ordinal);
		api.saveSession(session);
	}

	/*
	 * Deletes the set of nodes specified in the request
	 */
	public void deleteNodes(MongoSession session, DeleteNodesRequest req, DeleteNodesResponse res) {
		if (session == null) {
			session = ThreadLocals.getMongoSession();
		}

		for (String nodeId : req.getNodeIds()) {
			deleteNode(session, nodeId);
		}

		// no need to save session after deletes.
		// api.saveSession(session);
		res.setSuccess(true);
	}

	private void deleteNode(MongoSession session, String nodeId) {
		SubNode node = api.getNode(session, nodeId);
		
		//DO NOT DELETE: this is the legacy delete. (switching to soft-deletes, below)
		api.delete(session, node);

		// todo-0: this code was completed, but failed my testing. doesn't work, but it's late so i'm stopping and re-enabling the above.
		// api.softDelete(session, node);
		// api.saveSession(session);
	}

	/*
	 * Moves a set of nodes to a new location, underneath (i.e. children of) the target node
	 * specified.
	 */
	public void moveNodes(MongoSession session, MoveNodesRequest req, MoveNodesResponse res) {
		if (session == null) {
			session = ThreadLocals.getMongoSession();
		}

		moveNodesInternal(session, req, res);
	}

	private void moveNodesInternal(MongoSession session, MoveNodesRequest req, MoveNodesResponse res) {

		//If req.location==inside then the targetId is the parent node we will be inserting children into, but if
		//req.location==inline the targetId represents the child who will become a sibling of what we are inserting,
		//and the inserted nodes will be pasted in directly below that ordinal (i.e. new siblings posted in below it)
		String targetId = req.getTargetNodeId();
		//log.debug("moveNodesInternal: targetId=" + targetId);
		SubNode targetNode = api.getNode(session, targetId);

		SubNode parentToPasteInto = req.getLocation().equalsIgnoreCase("inside") ? targetNode
				: api.getParent(session, targetNode);

		api.authRequireOwnerOfNode(session, parentToPasteInto);
		String parentPath = parentToPasteInto.getPath();
		//log.debug("targetPath: " + targetPath);
		Long curTargetOrdinal = null;

		//location==inside
		if (req.getLocation().equalsIgnoreCase("inside")) {
			curTargetOrdinal = targetNode.getMaxChildOrdinal() == null ? 0 : targetNode.getMaxChildOrdinal();
		} 
		//location==inline
		else {
			curTargetOrdinal = targetNode.getOrdinal()+1;
			api.insertOrdinal(session, parentToPasteInto, curTargetOrdinal, req.getNodeIds().size());
		}

		for (String nodeId : req.getNodeIds()) {
			//log.debug("Moving ID: " + nodeId);
			try {
				SubNode node = api.getNode(session, nodeId);
				api.authRequireOwnerOfNode(session, node);
				SubNode nodeParent = api.getParent(session, node);

				//If this 'node' will be changing parents (moving to new parent) we need to update its subgraph,
				//of all children and also update its own path, otherwise it's staying under same parent
				//and only it's ordinal will change.
				if (nodeParent.getId().compareTo(parentToPasteInto.getId()) != 0) {
					changePathOfSubGraph(session, node, parentPath);
					node.setPath(parentPath + "/" + node.getNameOnPath());
				}

				node.setOrdinal(curTargetOrdinal);
				node.setDisableParentCheck(true);

				curTargetOrdinal++;
			} catch (Exception e) {
				// silently ignore if node cannot be found.
			}
		}
		api.saveSession(session);
		res.setSuccess(true);
	}

	private void changePathOfSubGraph(MongoSession session, SubNode graphRoot, String newPathPrefix) {
		String originalPath = graphRoot.getPath();
		log.debug("originalPath (graphRoot.path): " + originalPath);
		int originalParentPathLen = graphRoot.getParentPath().length();

		for (SubNode node : api.getSubGraph(session, graphRoot)) {
			if (!node.getPath().startsWith(originalPath)) {
				throw new RuntimeException(
						"Algorighm failure: path " + node.getPath() + " should have started with " + originalPath);
			}
			log.debug("PROCESSING MOVE: oldPath: " + node.getPath());

			String newPath = newPathPrefix + "/" + node.getPath().substring(originalParentPathLen + 1);
			log.debug("    newPath: " + newPath);
			node.setPath(newPath);
			node.setDisableParentCheck(true);
		}
	}

	public void selectAllNodes(MongoSession session, SelectAllNodesRequest req, SelectAllNodesResponse res) {
		if (session == null) {
			session = ThreadLocals.getMongoSession();
		}

		String nodeId = req.getParentNodeId();
		SubNode node = api.getNode(session, nodeId);
		List<String> nodeIds = api.getChildrenIds(session, node, false, null);
		res.setNodeIds(nodeIds);
		res.setSuccess(true);
	}
}
