package com.patrick.fintech.loan_backend.service;

import com.patrick.fintech.loan_backend.model.*;
import com.patrick.fintech.loan_backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.List;

@Service
public class BorrowerFileService {

    private final BorrowerFileRepository fileRepository;
    private final BorrowerRepository borrowerRepository;

    public BorrowerFileService(BorrowerFileRepository f, BorrowerRepository b) {
        this.fileRepository = f;
        this.borrowerRepository = b;
    }

    public BorrowerFile upload(Long borrowerId, MultipartFile file) throws IOException {
        Borrower borrower = borrowerRepository.findById(borrowerId)
            .orElseThrow(() -> new RuntimeException("Borrower not found: " + borrowerId));
        BorrowerFile bf = new BorrowerFile();
        bf.setFileName(file.getOriginalFilename());
        bf.setFileType(file.getContentType());
        bf.setFileSize(file.getSize());
        bf.setData(file.getBytes());
        bf.setBorrower(borrower);
        return fileRepository.save(bf);
    }

    public List<BorrowerFile> getByBorrower(Long borrowerId) {
        return fileRepository.findByBorrowerId(borrowerId);
    }

    public BorrowerFile getById(Long fileId) {
        return fileRepository.findById(fileId)
            .orElseThrow(() -> new RuntimeException("File not found: " + fileId));
    }

    public void delete(Long fileId) {
        fileRepository.deleteById(fileId);
    }
}