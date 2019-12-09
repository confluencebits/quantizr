package org.subnode.config;

import java.io.IOException;
import java.util.HashMap;

import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.subnode.mongo.MongoThreadLocal;
import org.subnode.util.ThreadLocals;

/**
 * This is Web Filter to measure basic application statistics (number of users,
 * etc)
 */
@Component
public class AppFilter implements Filter {
	private static final Logger log = LoggerFactory.getLogger(AppFilter.class);

	private static final HashMap<String, Integer> uniqueIpHits = new HashMap<String, Integer>();

	@Override
	public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
			throws IOException, ServletException {

		boolean initialSessionExisted = false;

		if (req instanceof HttpServletRequest) {
			HttpServletRequest httpReq = (HttpServletRequest) req;

			HttpSession session = httpReq.getSession(false);
			if (session == null) {
				log.trace("******** NO SESSION.");
			} else {
				log.trace("******** SESSION existed: lastAccessed: "
						+ ((System.currentTimeMillis() - session.getLastAccessedTime()) / 1000) + "secs ago.");

				initialSessionExisted = true;
			}

			if (session == null) {
				session = httpReq.getSession(true);
			}
			ThreadLocals.setHttpSession(session);
			String queryString = httpReq.getQueryString();

			String url = "REQ: URI=" + httpReq.getRequestURI() + "  QueryString=" + queryString;
			String uri = httpReq.getRequestURI();
			if (uri.startsWith("/r/")) {
				session.setAttribute("uri", uri);
			}
			log.debug(url);

			updateHitCounter(httpReq);
		} else {
			// log.debug("******* req class: "+req.getClass().getName());
		}

		ThreadLocals.setInitialSessionExisted(initialSessionExisted);

		if (res instanceof HttpServletResponse) {
			ThreadLocals.setServletResponse((HttpServletResponse) res);
		}

		try {
			chain.doFilter(req, res);
			HttpServletResponse httpRes = (HttpServletResponse) res;
			log.trace("    RES: "/* +httpRes.getStatus() */ + HttpStatus.valueOf(httpRes.getStatus()));
		} catch (RuntimeException ex) {
			log.error("Request Failed", ex);
			throw ex;
		} finally {
			/* Set thread back to clean slate, for it's next cycle time in threadpool */
			ThreadLocals.removeAll();
			MongoThreadLocal.removeAll();
		}
	}

	private void updateHitCounter(HttpServletRequest httpReq) {
		String ip = getClientIpAddr(httpReq);

		synchronized (uniqueIpHits) {
			Integer hitCount = ip != null ? uniqueIpHits.get(ip) : null;

			if (hitCount == null) {
				uniqueIpHits.put(ip, 1);
			} else {
				hitCount = hitCount.intValue() + 1;
				uniqueIpHits.put(ip, hitCount);
			}
		}
	}

	/*
	 * I found this code online and it is not fully tested, but according to my
	 * research it is the best way you can try determining the source IP.
	 */
	public static String getClientIpAddr(HttpServletRequest request) {
		String ip = request.getHeader("X-Forwarded-For");
		if (!unknownIp(ip))
			return ip;

		ip = request.getHeader("Proxy-Client-IP");
		if (!unknownIp(ip))
			return ip;

		ip = request.getHeader("WL-Proxy-Client-IP");
		if (!unknownIp(ip))
			return ip;

		ip = request.getHeader("HTTP_CLIENT_IP");
		if (!unknownIp(ip))
			return ip;

		ip = request.getHeader("HTTP_X_FORWARDED_FOR");
		if (!unknownIp(ip))
			return ip;

		ip = request.getRemoteAddr();
		if (!unknownIp(ip))
			return ip;

		return "unknown";
	}

	public static boolean unknownIp(String ip) {
		return ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip);
	}

	@Override
	public void destroy() {
	}

	@Override
	public void init(FilterConfig arg0) throws ServletException {
	}

	public static HashMap<String, Integer> getUniqueIpHits() {
		return uniqueIpHits;
	}
}