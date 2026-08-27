import {
  SandpackCodeEditor,
  SandpackLayout,
  SandpackPreview,
  SandpackProvider,
  type SandpackFiles,
  type SandpackPredefinedTemplate,
  type SandpackSetup,
} from '@codesandbox/sandpack-react';

interface SandpackProps {
  template?: SandpackPredefinedTemplate;
  customSetup?: SandpackSetup;
  files?: SandpackFiles;
  codeViewer?: boolean;
}

// The <Sandpack /> component the workshop mdx files expect in scope.
export function Sandpack({ template = 'react-ts', customSetup, files = {} }: SandpackProps) {
  return (
    <SandpackProvider
      template={template}
      customSetup={customSetup}
      files={files}
      theme="dark"
      options={{ initMode: 'lazy' }}
    >
      <SandpackLayout style={{ height: 560 }}>
        <SandpackCodeEditor
          showTabs
          showLineNumbers
          wrapContent
          style={{ height: '100%', flex: 1, minWidth: 0 }}
        />
        <SandpackPreview style={{ height: '100%', flex: 1, minWidth: 0 }} />
      </SandpackLayout>
    </SandpackProvider>
  );
}
