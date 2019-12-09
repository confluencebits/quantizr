package org.subnode.mail;

import java.util.Date;
import java.util.Properties;

import javax.mail.Message;
import javax.mail.Session;
import javax.mail.event.TransportEvent;
import javax.mail.event.TransportListener;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeMessage;

import org.subnode.config.AppProp;
import org.subnode.util.ExUtil;
import com.sun.mail.smtp.SMTPTransport;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;

@Component
@Scope("prototype")
public class MailSender implements TransportListener {

	private static final Logger log = LoggerFactory.getLogger(MailSender.class);

	@Autowired
	private AppProp appProp;

	public static final String MIME_HTML = "text/html";
	public int TIMEOUT = 10000; // ten seconds
	public int TIMESLICE = 250; // quarter second

	public boolean debug = true;
	public boolean initialized = false;

	private Properties props;
	private Session mailSession;
	private SMTPTransport transport;

	/*
	 * This method can and should be called before sending mails, close() method
	 * should be called after mail is sent
	 */
	public void init() {
		if (initialized)
			return;
		initialized = true;

		String mailHost = appProp.getMailHost();
		String mailUser = appProp.getMailUser();
		String mailPassword = appProp.getMailPassword();

		props = new Properties();
		props.put("mail.smtps.host", mailHost);
		props.put("mail.smtps.auth", "true");

		// NOTE: I had 'getDefaultInstance' here for many years, but the MailGun exampls
		// used 'getInstance' so i switched.
		mailSession = Session.getInstance(props, null);
		mailSession.setDebug(debug);

		try {
			transport = (SMTPTransport) mailSession.getTransport("smtps");
			transport.addTransportListener(this);
			transport.connect(mailHost, mailUser, mailPassword);
		} catch (Exception e) {
			throw ExUtil.newEx(e);
		}
	}

	public void close() {
		if (transport != null) {
			try {
				transport.close();
			} catch (Exception e) {
				throw ExUtil.newEx(e);
			} finally {
				transport = null;
			}
		}
	}

	public void sendMail(String sendToAddress, String fromAddress, String content, String subjectLine) {

		if (fromAddress == null) {
			fromAddress = appProp.getMailFrom();
		}

		if (transport == null) {
			throw ExUtil.newEx("Tried to use MailSender after close() call or without initializing.");
		}

		MimeMessage message = new MimeMessage(mailSession);
		try {
			message.setSentDate(new Date());
			message.setSubject(subjectLine);
			message.setFrom(new InternetAddress(fromAddress));
			message.setRecipient(Message.RecipientType.TO, new InternetAddress(sendToAddress));

			// MULTIPART
			// ---------------
			// MimeMultipart multipart = new MimeMultipart("part");
			// BodyPart messageBodyPart = new MimeBodyPart();
			// messageBodyPart.setContent(content, "text/html");
			// multipart.addBodyPart(messageBodyPart);
			// message.setContent(multipart);

			// SIMPLE (no multipart)
			// ---------------
			message.setContent(content, MIME_HTML);

			// can get alreadyconnected exception here ??
			// transport.connect(mailHost, mailUser, mailPassword);

			/*
			 * important: while inside this 'sendMessage' method, the 'messageDelivered'
			 * callback will get called if the send is successful, so we can return the
			 * value below, even though we do not set it in this method
			 */

			transport.sendMessage(message, message.getRecipients(Message.RecipientType.TO));

			//I'm not sure if the callbacks are on this same thread or not. Commenting out pending research into this.
			//log.debug("Response: " + transport.getLastServerResponse() + " Code: " + transport.getLastReturnCode());
		} catch (Exception e) {
			throw ExUtil.newEx(e);
		}
	}

	@Override
	public void messageDelivered(TransportEvent arg) {
		log.debug("messageDelivered.");
	}

	@Override
	public void messageNotDelivered(TransportEvent arg) {
		log.debug("messageNotDelivered.");
	}

	@Override
	public void messagePartiallyDelivered(TransportEvent arg) {
		log.debug("messagePartiallyDelivered.");
	}
}