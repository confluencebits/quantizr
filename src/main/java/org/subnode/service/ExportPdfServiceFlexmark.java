package org.subnode.service;

import java.io.File;
import java.io.FileOutputStream;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;
import org.subnode.config.AppProp;
import org.subnode.config.ConstantsProvider;
import org.subnode.config.SessionContext;
import org.subnode.model.UserPreferences;
import org.subnode.model.client.NodeProp;
import org.subnode.mongo.MongoRead;
import org.subnode.mongo.MongoSession;
import org.subnode.mongo.model.SubNode;
import org.subnode.request.ExportRequest;
import org.subnode.response.ExportResponse;
import org.subnode.util.ExUtil;
import org.subnode.util.FileUtils;
import org.subnode.util.StreamUtil;
import org.subnode.util.SubNodeUtil;
import org.subnode.util.ThreadLocals;

import com.vladsch.flexmark.util.ast.Node;
import com.vladsch.flexmark.html.HtmlRenderer;
import com.vladsch.flexmark.parser.Parser;
import com.vladsch.flexmark.pdf.converter.PdfConverterExtension;
import com.vladsch.flexmark.util.data.MutableDataSet;

/**
 * https://github.com/vsch/flexmark-java
 */
@Component
@Scope("prototype")
public class ExportPdfServiceFlexmark {
	private static final Logger log = LoggerFactory.getLogger(ExportPdfServiceFlexmark.class);

	@Autowired
	private SubNodeUtil util;

	@Autowired
	private AppProp appProp;

	@Autowired
	private MongoRead read;

	@Autowired
	private ConstantsProvider constProvider;

	@Autowired
	private SessionContext sessionContext;

	private MongoSession session;

	private String shortFileName;
	private String fullFileName;

	private StringBuilder markdown = new StringBuilder();

	/*
	 * Exports the node specified in the req. If the node specified is "/", or the
	 * repository root, then we don't expect a filename, because we will generate a
	 * timestamped one.
	 */
	public void export(MongoSession session, ExportRequest req, ExportResponse res) {
		if (session == null) {
			session = ThreadLocals.getMongoSession();
		}
		this.session = session;

		UserPreferences userPreferences = sessionContext.getUserPreferences();
		boolean exportAllowed = userPreferences != null ? userPreferences.isExportAllowed() : false;
		if (!exportAllowed && !sessionContext.isAdmin()) {
			throw ExUtil.wrapEx("You are not authorized to export.");
		}

		String nodeId = req.getNodeId();

		if (!FileUtils.dirExists(appProp.getAdminDataFolder())) {
			throw ExUtil.wrapEx("adminDataFolder does not exist");
		}

		if (nodeId.equals("/")) {
			throw ExUtil.wrapEx("Exporting entire repository is not supported.");
		} else {
			log.info("Exporting to Text File");
			exportNodeToFile(session, nodeId);
			res.setFileName(shortFileName);
		}

		res.setSuccess(true);
	}

	private void exportNodeToFile(MongoSession session, String nodeId) {
		if (!FileUtils.dirExists(appProp.getAdminDataFolder())) {
			throw ExUtil.wrapEx("adminDataFolder does not exist.");
		}

		shortFileName = "f" + util.getGUID() + ".pdf";
		fullFileName = appProp.getAdminDataFolder() + File.separator + shortFileName;

		SubNode exportNode = read.getNode(session, nodeId, true);
		FileOutputStream out = null;
		try {
			MutableDataSet options = new MutableDataSet();

			// uncomment to set optional extensions
			// options.set(Parser.EXTENSIONS, Arrays.asList(TablesExtension.create(),
			// StrikethroughExtension.create()));

			// uncomment to convert soft-breaks to hard breaks
			// options.set(HtmlRenderer.SOFT_BREAK, "<br />\n");

			Parser parser = Parser.builder(options).build();
			HtmlRenderer renderer = HtmlRenderer.builder(options).build();

			recurseNode(exportNode, 0);

			Node document = parser.parse(markdown.toString());
			String html = renderer.render(document);

			// todo-0: just by writing html to file we can implement an HTML export option!

			out = new FileOutputStream(new File(fullFileName));

			// Using font weight 700 makes headings less bold in the generated PDF
			// String fontFace = "@font-face {src: url('" + constProvider.getHostAndPort()
			// 		+ "/fonts/Roboto/Roboto-Light.ttf'); font-family: 'QuantaCustomFont'; font-weight: 700;}\n";

			String fontFace = "@font-face {src: url('" + constProvider.getHostAndPort()
					+ "/fonts/Roboto/Roboto-Light.ttf'); font-family: 'QuantaCustomFont';}\n";

			html = PdfConverterExtension.embedCss(html, fontFace + "body {font-family: 'QuantaCustomFont';}\n");

			// log.debug("HTML=" + html);

			PdfConverterExtension.exportToPdf(out, html, "", options);

		} catch (Exception ex) {
			throw ExUtil.wrapEx(ex);
		} finally {
			StreamUtil.close(out);
			(new File(fullFileName)).deleteOnExit();
		}
	}

	private void recurseNode(SubNode node, int level) {
		if (node == null)
			return;

		processNode(node);
		Sort sort = Sort.by(Sort.Direction.ASC, SubNode.FIELD_ORDINAL);

		for (SubNode n : read.getChildren(session, node, sort, null)) {
			recurseNode(n, level + 1);
		}
	}

	private void processNode(SubNode node) {
		String content = node.getContent();
		markdown.append("\n");
		markdown.append(content);
		markdown.append("\n");
		writeImage(node);
	}

	private void writeImage(SubNode node) {
		String bin = node.getStringProp(NodeProp.BIN.s());
		if (bin == null) {
			return;
		}

		String style = "";
		String imgSize = node.getStringProp(NodeProp.IMG_SIZE.s());
		if (imgSize != null && imgSize.endsWith("%") || imgSize.endsWith("px")) {
			style = " style='width:" + imgSize + "'";
		}

		markdown.append("\n<img src='" + constProvider.getHostAndPort() + "/mobile/api/bin/" + bin + "?nodeId="
				+ node.getId().toHexString() + "&token=" + sessionContext.getUserToken() + "' " + style + "/>\n");
	}
}