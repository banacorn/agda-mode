#!/usr/bin/env emacs --batch --script
;; -*- mode: Lisp; lexical-binding: t; -*-
;; Usage:
;;   ./keymap.el print [--agda-emacs-mode-dir <dir>]
;;   ./keymap.el generate [--out-dir <dir>] [--agda-emacs-mode-dir <dir>] [--pretty]
;;
;; Flags are:
;;   --agda-emacs-mode-dir
;;     Where to find the `emacs-mode.el` library.
;;     If not provided, it first your load-path, then attempts `agde-mode
;;     locate`, and then attempts to find the data dir via `ghc-pkg`.
;;
;;   --out-dir (default: ./asset)
;;     When generating, where to write {keymap,query}.{js,json}
;;
;;   --pretty
;;     When generating, pretty-print the JSON.
;;
(setq debug-on-error t)

;; String utilities
;; {{

(defun string-trim (str)
  (replace-regexp-in-string "^[\n\r\t ]*\\|[\n\r\t ]*$" "" str))

(defun replace-all-regexps-in-string (str regexps)
  (if regexps
    (seq-let (orig rep) (car regexps)
      (replace-all-regexps-in-string
       (replace-regexp-in-string orig rep str)
       (cdr regexps)))
    str))

(defun as-string (char-or-str)
  (if (stringp char-or-str)
    char-or-str
    (string char-or-str)))

(defun strip-leading-backslash (str)
  (if (and (> (length str) 0) (equal (substring str 0 1) "\\"))
    (substring str 1)
    str))

;; }}

;; Hash/trie/mapping utilities
;; {{

(defun alterhash (key fn trie)
  (puthash key (funcall fn (gethash key trie)) trie))

(defun each-mapping (fn mappings)
  (dolist (mapping mappings)
     (let* ((charseq (strip-leading-backslash (car mapping)))
            (symbol-or-symbols (cdr mapping))
            (symbols (if (characterp symbol-or-symbols)
                       (list symbol-or-symbols)
                       symbol-or-symbols)))
       (seq-doseq (sym symbols) (funcall fn charseq (as-string sym))))))

(defun add-to-trie (trie charseq sym)
  (if (> (length charseq) 0)
    (let* ((the-char (substring charseq 0 1))
           (the-rest (substring charseq 1))
           (subtrie (gethash the-char trie (make-hash-table :test 'equal))))
      (add-to-trie subtrie the-rest sym)
      (puthash the-char subtrie trie))
    (alterhash ">>" (lambda (sym-list) (append sym-list (list sym))) trie)))

(defun mk-trie (mappings)
  (let ((the-trie (make-hash-table :test 'equal)))
    (each-mapping
      (lambda (charseq sym) (add-to-trie the-trie charseq sym))
      mappings)
    the-trie))

(defun mk-lookup (mappings)
  (let ((the-table (make-hash-table :test 'equal)))
    (each-mapping
      (lambda (charseq sym)
        (let ((sym-num (format "%d" (string-to-char sym))))
          (alterhash sym-num (lambda (seqs) (append (list charseq) seqs)) the-table)))
      mappings)
    the-table))

(defun print-mapping (charseq sym) (princ (format "%s\t%s\n" charseq sym)))
(defun print-mappings (mappings) (each-mapping 'print-mapping mappings))

;; }}

;; Generating the JSON and JavaScript assets
;; {{

(require 'json)

(defun mk-js-module (json)
  (format
    "module.exports.default = %s;\n"
    (replace-all-regexps-in-string
      json
      ; JavaScript and JSON interpret these newline chars differently.
      ; https://stackoverflow.com/a/9168133
      '(("\u2028" "\\\\u2028")
        ("\u2029" "\\\\u2029")))))

; Strangely this is not defined/exported in agda-input.el
(defconst *agda-quail-package-name* "Agda")

;; Assumes agda-input.el has been loaded and has provided the Quail package.
(defun save-keymap-assets (out-dir pretty)
  (let* ((json-encoding-pretty-print pretty)
         (json-encoding-object-sort-predicate 'string<)
         (keymap (agda-input-get-translations *agda-quail-package-name*)))
    (dolist (opts '(("keymap" mk-trie) ("query" mk-lookup)))
      (seq-let (base-name mk-fn) opts
        (let* ((obj (funcall mk-fn keymap))
               (json-data (json-encode obj)))
          (dolist (outputs `((".json" ,json-data)
                             (".js" ,(mk-js-module json-data))))
            (seq-let (fname-ext contents) outputs
              (let ((fname
                      (expand-file-name
                        (concat (file-name-as-directory out-dir) (concat base-name fname-ext))
                        nil)))
                (message "Writing %s" fname)
                (if (file-exists-p fname) (delete-file fname))
                (append-to-file contents nil fname)))))))))

;; }}

;; Locating agda-input.el
;; {{

(defconst *agda-input-lib-name* "agda-input")

(defun get-agda-mode-dir-from-locate ()
  ; Note thate "agda-mode locate" gives us agda2.el, but we want its parent dir so we can
  ; load agda-input.el
  (file-name-directory (string-trim (shell-command-to-string "agda-mode locate"))))

(defun get-agda-mode-dir-from-ghc-pkg ()
  (file-name-as-directory (string-trim (shell-command-to-string "ghc-pkg --simple-output field Agda data-dir"))))

(defun locate-agda-input-lib (agda-emacs-mode-dir-override)
  (let ((try-search-path-fns
          (if agda-emacs-mode-dir-override
              ; If an override path for agda-mode was given, look *only* in that path.
              (list (lambda () (list (file-name-as-directory agda-emacs-mode-dir-override))))
              ; Otherwise try a few things.
              (list
                ; Try searching in the normal load-path.
                (lambda () load-path)
                ; Otherwise, try "agda-mode locate", which gives us agda2.el, but we want its parent dir.
                (lambda () (list (get-agda-mode-dir-from-locate)))
                ; Otherwise try to find the installed Agda package's data-dir.
                (lambda () (list (get-agda-mode-dir-from-ghc-pkg)))))))
    (catch 'return
      (dolist (try-search-path-fn try-search-path-fns)
        (let ((found-agda-input (locate-library *agda-input-lib-name* nil (funcall try-search-path-fn))))
          (if found-agda-input
            (throw 'return found-agda-input)))))))

(defun get-agda-input-path (agda-emacs-mode-dir-override)
  (let ((discovered-path (locate-agda-input-lib agda-emacs-mode-dir-override)))
    (if discovered-path
      (progn
        (message "Found %s.el at %s" *agda-input-lib-name* discovered-path)
        discovered-path)
      (error "Could not find %s.el. Try the '--agda-emacs-mode-dir' flag." *agda-input-lib-name*))))

;; }}

;; Global state and command line args
;; {{

(defvar opt:agda-keymap-out-dir "./asset/")
(defun check-for-agda-keymap-out-dir-opt ()
  (if (equal argi "--out-dir")
    (if (not command-line-args-left)
      (error (format "Missing value for flag %s" argi))
      (progn
        (setq opt:agda-keymap-out-dir (file-name-directory (car command-line-args-left)))
        (setq command-line-args-left (cdr command-line-args-left))
        t))))

(defvar opt:agda-emacs-mode-dir-override nil)
(defun check-for-agda-emacs-mode-dir-opt ()
  (if (equal argi "--agda-emacs-mode-dir")
    (if (not command-line-args-left)
      (error (format "Missing value for flag %s" argi))
      (progn
        (setq opt:agda-emacs-mode-dir-override (car command-line-args-left))
        (setq command-line-args-left (cdr command-line-args-left))
        t))))

(defvar opt:agda-keymap-pretty-json nil)
(defun check-for-pretty-flag ()
  (if (equal argi "--pretty")
    (setf opt:agda-keymap-pretty-json t)))

(defvar opt:agda-cli-action nil)
(defun check-for-cli-action ()
  (pcase argi
    ("print" (setf opt:agda-cli-action 'print))
    ("generate" (setf opt:agda-cli-action 'generate))))

(if noninteractive
  (progn
    (setq
      command-line-functions
      (append '(check-for-agda-keymap-out-dir-opt
                check-for-agda-emacs-mode-dir-opt
                check-for-pretty-flag
                check-for-cli-action)
              command-line-functions))
    (command-line-1 command-line-args-left)
    (load (get-agda-input-path opt:agda-emacs-mode-dir-override) nil t)
    (pcase opt:agda-cli-action
      ('print (print-mappings (agda-input-get-translations *agda-quail-package-name*)))
      ('generate (save-keymap-assets opt:agda-keymap-out-dir opt:agda-keymap-pretty-json))
      (otherwise (error "You must specify an action! ('print' or 'generate').")))
    ; Kill emacs; otherwise it would try to parse the command line args again, try
    ; to initialize a terminal, etc. before killing itself.
    (kill-emacs t)))

;; }}
