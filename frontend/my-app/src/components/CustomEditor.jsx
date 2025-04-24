// components/custom-editor.js
// Required only in App Router.

/**
 * This configuration was generated using the CKEditor 5 Builder. You can modify it anytime using this link:
 * https://ckeditor.com/ckeditor-5/builder/?redirect=docs#installation/NoRgTANARGB0CssAMVoBYDMGkA4zxzQE4A2DeJEgdiIzSqxBJJErCPhA9bDVSgCmAO1SRQEEBCQSpEgLrR4AQyr14GKHKA==
 */
'use client'
import { useState, useEffect, useRef, useMemo } from "react";
// import { CKEditor } from "@ckeditor/ckeditor5-react";

import React from 'react';
import { CKEditor, useCKEditorCloud } from '@ckeditor/ckeditor5-react';

import "ckeditor5/ckeditor5.css";

// import './App.css';

/**
 * Create a free account with a trial: https://portal.ckeditor.com/checkout?plan=free
 */
const LICENSE_KEY = "eyJhbGciOiJFUzI1NiJ9.eyJleHAiOjE3NDY3NDg3OTksImp0aSI6IjdhNWVhYjRjLTgzMmQtNGE3Yi1hZTQwLTllNTllOGNlYmFkYyIsInVzYWdlRW5kcG9pbnQiOiJodHRwczovL3Byb3h5LWV2ZW50LmNrZWRpdG9yLmNvbSIsImRpc3RyaWJ1dGlvbkNoYW5uZWwiOlsiY2xvdWQiLCJkcnVwYWwiLCJzaCJdLCJ3aGl0ZUxhYmVsIjp0cnVlLCJsaWNlbnNlVHlwZSI6InRyaWFsIiwiZmVhdHVyZXMiOlsiKiJdLCJ2YyI6IjI0NmIyMDI0In0.qhtry0aYNPiPzEkMxKxdeaQlCVWO0rWFfgCIT2uq-UrurBKu7UnIhFc5MzLoOHHHFxP0-72305DfD1DPBas4pQ"; // or <YOUR_LICENSE_KEY>.

// type Props = {
//     name: string;
//     value: string;
//     onChange: (e: { target: { name: string; value: string } }) => void;
//   };
  

export function CustomEditor({name, value, onChange} ) {
	const editorContainerRef = useRef(null);
	const editorRef = useRef(null);
	const [isLayoutReady, setIsLayoutReady] = useState(false);
	const cloud = useCKEditorCloud({ version: '45.0.0' });
  useEffect(() => {
    setIsLayoutReady(true);

    return () => setIsLayoutReady(false);
  }, []);


  const { BalloonEditor,  editorConfig } = useMemo(() => {
    
    if (cloud.status !== 'success' ||!isLayoutReady) {
      return {};
    }
    if ( cloud.status === 'error' ) {
      return <div>Error!</div>;
    }
    
    if ( cloud.status === 'loading' ) {
      return <div>Loading...</div>;
    }
    const {
      BalloonEditor,
      Autoformat,
      AutoImage,
      Autosave,
      BalloonToolbar,
      BlockQuote,
      Bold,
      Emoji,
      Essentials,
      FontBackgroundColor,
      FontColor,
      FontFamily,
      FontSize,
      Heading,
      ImageBlock,
      ImageCaption,
      ImageInline,
      ImageInsert,
      ImageInsertViaUrl,
      ImageResize,
      ImageStyle,
      ImageTextAlternative,
      ImageToolbar,
      ImageUpload,
      Indent,
      IndentBlock,
      Italic,
      Link,
      LinkImage,
      List,
      ListProperties,
      Markdown,
      MediaEmbed,
      Mention,
      Paragraph,
      PasteFromMarkdownExperimental,
      PasteFromOffice,
      SimpleUploadAdapter,
      Table,
      TableCaption,
      TableCellProperties,
      TableColumnResize,
      TableProperties,
      TableToolbar,
      TextTransformation,
      TodoList,
      Underline,
      GeneralHtmlSupport,
    } = cloud.CKEditor;

    return {
      BalloonEditor,
      editorConfig: {
        toolbar: {
          items: [
            "heading",
            "|",
            "fontSize",
            "fontFamily",
            "fontColor",
            "fontBackgroundColor",
            "|",
            "bold",
            "italic",
            "underline",
            "|",
            "emoji",
            "link",
            "insertImage",
            "mediaEmbed",
            "insertTable",
            "blockQuote",
            "|",
            "bulletedList",
            "numberedList",
            "todoList",
            "outdent",
            "indent",
          ],
          shouldNotGroupWhenFull: false,
        },
        plugins: [
          Autoformat,
          AutoImage,
          Autosave,
          BalloonToolbar,
          BlockQuote,
          Bold,
          Emoji,
          Essentials,
          FontBackgroundColor,
          FontColor,
          FontFamily,
          FontSize,
          Heading,
          ImageBlock,
          ImageCaption,
          ImageInline,
          ImageInsert,
          ImageInsertViaUrl,
          ImageResize,
          ImageStyle,
          ImageTextAlternative,
          ImageToolbar,
          ImageUpload,
          Indent,
          IndentBlock,
          Italic,
          Link,
          LinkImage,
          List,
          ListProperties,
          Markdown,
          MediaEmbed,
          Mention,
          Paragraph,
          PasteFromMarkdownExperimental,
          PasteFromOffice,
          SimpleUploadAdapter,
          Table,
          TableCaption,
          TableCellProperties,
          TableColumnResize,
          TableProperties,
          TableToolbar,
          TextTransformation,
          TodoList,
          Underline,
          GeneralHtmlSupport,
        ],
        balloonToolbar: [
          "bold",
          "italic",
          "|",
          "link",
          "insertImage",
          "|",
          "bulletedList",
          "numberedList",
        ],
        heading: {
          options: [
            {
              model: "paragraph",
              title: "Paragraph",
              class: "ck-heading_paragraph",
            },
            {
              model: "heading1",
              view: {
                name: "h1",
                classes: ["text-3xl", "font-semibold"],
              },
              title: "Heading 1",
              class: "ck-heading_heading1",
            },
            {
              model: "heading2",
              view: {
                name: "h2",
                classes: ["text-2xl", "font-semibold"],
              },
              title: "Heading 2",
              class: "ck-heading_heading2",
            },
            {
              model: "heading3",
              view: {
                name: "h3",
                classes: ["text-xl", "font-semibold"],
              },
              title: "Heading 3",
              class: "ck-heading_heading3",
            },
            {
              model: "heading4",
              view: "h4",
              title: "Heading 4",
              class: "ck-heading_heading4",
            },
            {
              model: "heading5",
              view: "h5",
              title: "Heading 5",
              class: "ck-heading_heading5",
            },
            {
              model: "heading6",
              view: "h6",
              title: "Heading 6",
              class: "ck-heading_heading6",
            },
          ],
        },
        image: {
          toolbar: [
            "toggleImageCaption",
            "imageTextAlternative",
            "|",
            "imageStyle:inline",
            "imageStyle:wrapText",
            "imageStyle:breakText",
            "|",
            "resizeImage",
          ],
        },
        initialData: "<h2 class=\"text-2xl font-semibold\">You can tell us more about here</h2>\n<p>Why do you need this fund?</p?\>",
        licenseKey: LICENSE_KEY,
        link: {
          addTargetToExternalLinks: true,
          defaultProtocol: "https://",
          decorators: {
            toggleDownloadable: {
              mode: "manual",
              label: "Downloadable",
              attributes: {
                download: "file",
              },
            },
          },
        },
        list: {
          properties: {
            styles: true,
            startIndex: true,
            reversed: true,
          },
        },
        mention: {
          feeds: [
            {
              marker: "@",
              feed: [
                /* See: https://ckeditor.com/docs/ckeditor5/latest/features/mentions.html */
              ],
            },
          ],
        },
        placeholder: "Type or paste your content here!",
        table: {
          contentToolbar: [
            "tableColumn",
            "tableRow",
            "mergeTableCells",
            "tableProperties",
            "tableCellProperties",
          ],
        },
        htmlSupport: {
          allow: [
            {
              name: /.*/,
              attributes: true,
              classes: true,
              styles: true,
            },
          ],
        },
      },
    };
  }, [cloud, isLayoutReady]);

  return (
    <div className="main-container p-2">
      <div
        className="editor-container editor-container_balloon-editor h-[50vh]"
        ref={editorContainerRef}
      >
        <div className="editor-container__editor max-h-[49vh] p-2">
          <div ref={editorRef}>
            {BalloonEditor && editorConfig && (
              <CKEditor editor={BalloonEditor} config={editorConfig}       
              data={value}
              onChange={(_, editor) => {
                onChange({ target: { name, value: editor.getData() } });
              }}
            />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


