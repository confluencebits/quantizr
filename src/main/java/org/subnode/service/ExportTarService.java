package org.subnode.service;

import org.apache.commons.compress.archivers.tar.TarArchiveOutputStream;
import org.apache.commons.compress.compressors.gzip.GzipCompressorOutputStream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;
import org.subnode.util.ExUtil;
import org.apache.commons.compress.archivers.tar.TarArchiveEntry;

import java.io.FileOutputStream;

@Component
@Scope("prototype")
public class ExportTarService extends ExportArchiveBase {
    private static final Logger log = LoggerFactory.getLogger(ExportTarService.class);

    private TarArchiveOutputStream out = null;
    private boolean gzip = false;

    @Override
    public void openOutputStream(String fileName) {
        log.debug("Opening Export File: " + fileName);
        try {
            out = gzip
                    ? new TarArchiveOutputStream(new GzipCompressorOutputStream(new FileOutputStream(fileName)))
                    : new TarArchiveOutputStream(new FileOutputStream(fileName));

            // TAR has an 8 gig file limit by default, this gets around that
            out.setBigNumberMode(TarArchiveOutputStream.BIGNUMBER_STAR);

            // TAR originally didn't support long file names, so enable the support for it
            out.setLongFileMode(TarArchiveOutputStream.LONGFILE_GNU);

            out.setAddPaxHeadersForNonAsciiNames(true);
        } catch (Exception ex) {
            throw ExUtil.newEx(ex);
        }
    }

    @Override
    public void closeOutputStream() {
        try {
            out.close();
        } catch (Exception ex) {
            throw ExUtil.newEx(ex);
        }
    }

    @Override
    public void addEntry(String fileName, byte[] bytes) {
        log.debug("Add Entry: " + fileName + " bytes.length=" + bytes.length);

        TarArchiveEntry tarArchiveEntry = new TarArchiveEntry(fileName);
        tarArchiveEntry.setSize(bytes.length);

        try {
            out.putArchiveEntry(tarArchiveEntry);
            out.write(bytes);
            out.closeArchiveEntry();
        } catch (Exception ex) {
            throw ExUtil.newEx(ex);
        }
    }

    @Override
    public String getFileExtension() {
        return gzip ? "tar.gz" : "tar";
    }

    public void setUseGZip(boolean gzip) {
        this.gzip = gzip;
    }
}