package com.patrick.fintech.loan_backend.controller;

import com.patrick.fintech.loan_backend.dto.ApiResponse;
import com.patrick.fintech.loan_backend.model.BorrowerFile;
import com.patrick.fintech.loan_backend.service.BorrowerFileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class BorrowerFileController {

    private final BorrowerFileService fileService;

    @PostMapping("/upload/{borrowerId}")
    public ResponseEntity<ApiResponse<BorrowerFile>> upload(
            @PathVariable Long borrowerId,
            @RequestParam("file") MultipartFile file) throws Exception {
        BorrowerFile saved = fileService.upload(borrowerId, file);
        return ResponseEntity.ok(ApiResponse.ok("File uploaded", saved));
    }

    @GetMapping("/borrower/{borrowerId}")
    public ResponseEntity<ApiResponse<List<BorrowerFile>>> getFiles(
            @PathVariable Long borrowerId) {
        return ResponseEntity.ok(ApiResponse.ok(fileService.getByBorrower(borrowerId)));
    }

    @GetMapping("/download/{fileId}")
    public ResponseEntity<byte[]> download(@PathVariable Long fileId) {
        BorrowerFile file = fileService.getById(fileId);
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(
                file.getFileType() != null ? file.getFileType() : "application/octet-stream"))
            .header(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=\"" + file.getFileName() + "\"")
            .body(file.getData());
    }

    @DeleteMapping("/{fileId}")
    public ResponseEntity<Void> delete(@PathVariable Long fileId) {
        fileService.delete(fileId);
        return ResponseEntity.noContent().build();
    }
}