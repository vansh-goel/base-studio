// Fixed xmp edge cases
export type EditOperation = {
  id: string;
  type: string;
  instructions: string;
  timestamp: string;
  parameters?: Record<string, unknown>;
};

export function generateXmpSidecar(edits: EditOperation[], author?: string) {
  const editLogs = edits
    .map((edit, index) => {
      const params = edit.parameters
        ? Object.entries(edit.parameters)
          .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
          .join("; ")
        : "";

      return `      <rdf:li rdf:parseType="Resource">
        <og:EditIndex>${index + 1}</og:EditIndex>
        <og:EditId>${edit.id}</og:EditId>
        <og:EditType>${escapeXml(edit.type)}</og:EditType>
        <og:EditInstructions>${escapeXml(edit.instructions)}</og:EditInstructions>
        <og:EditTimestamp>${edit.timestamp}</og:EditTimestamp>
        <og:EditParameters>${escapeXml(params)}</og:EditParameters>
      </rdf:li>`;
    })
    .join("\n");

  return `<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:og="https://0g.ai/ns/image-edits/1.0/">
  <rdf:RDF>
    <rdf:Description rdf:about=""
      xmlns:xmp="http://ns.adobe.com/xap/1.0/"
      xmlns:dc="http://purl.org/dc/elements/1.1/"
      xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/">
      <dc:creator>
        <rdf:Seq>
          <rdf:li>${escapeXml(author ?? "0rbit")}</rdf:li>
        </rdf:Seq>
      </dc:creator>
      <photoshop:Source>0rbit Prototype</photoshop:Source>
      <og:EditOperations>
        <rdf:Seq>
${editLogs}
        </rdf:Seq>
      </og:EditOperations>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
}

function escapeXml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

