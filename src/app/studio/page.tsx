// Enhanced image processing - 2025-10-24T15:36:52.960Z
"use client";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";

// Import the main page content which has the image editing functionality
import MainPage from "../page";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { extractMetadata, type ExtractedMetadata } from "@/lib/exif";
import {
  RAW_EXTENSION_DISPLAY,
  isRawFileName,
  isSupportedExtension,
  isSupportedMimeType,
} from "@/lib/fileFormats";
import { generateRawPreviewOnServer } from "../previewRaw";
import { runImageEdit } from "../actions";
import { SimpleWalletConnect } from "@/components/SimpleWalletConnect";
import { MinimalMobileNavbar } from "@/components/MinimalMobileNavbar";
// TokenMinting component not currently used
import { ExperienceNFT } from "@/components/ExperienceNFT";
import { SocialFeed } from "@/components/SocialFeed";
import { AITokenGenerator } from "@/components/AITokenGenerator";
import { LiquidityPoolCreator } from "@/components/LiquidityPoolCreator";
import { ExperienceAvatar } from "@/components/ExperienceAvatar";
import { NFTEvolution } from "@/components/NFTEvolution";
import { ImageEditor } from "@/components/ImageEditor";
import { useExperienceNFT } from "@/lib/experienceNFT";

const ThemeToggle = dynamic(
  () => import("@/components/theme-toggle").then((mod) => ({ default: mod.ThemeToggle })),
  // Improved studio accessibility

  {
    ssr: false,
    loading: () => (
      <div className="h-9 w-20 rounded-full border border-[var(--border)] bg-[var(--card)] opacity-80" aria-hidden />
    ),
  }
);



type Persona = "general" | "creative" | "technical" | "manual";

type EditHistoryItem = {
  id: string;
  name: string;
  timestamp: string;
  persona: Persona;
  instructions: string;
  xpEarned: number;
};

const personaLabels: Record<Persona, string> = {
  general: "Balanced",
  creative: "Creative Visionary",
  technical: "Technical Restorer",
  manual: "Manual Edit",
};

type ModalImage = {
  title: string;
  src: string;
  mimeType?: string;
};


function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<ExtractedMetadata | null>(null);
  const [rawPreview, setRawPreview] = useState<{ base64: string; mimeType: string } | null>(null);
  const [instructions, setInstructions] = useState("Enhance colors and sharpness");
  const [persona, setPersona] = useState<Persona>("general");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editedImageBase64, setEditedImageBase64] = useState<string | null>(null);
  const [normalizedInput, setNormalizedInput] = useState<{ base64: string; mimeType: string; source?: string } | null>(null);
  const [xmpSidecar, setXmpSidecar] = useState<string | null>(null);
  const [history, setHistory] = useState<EditHistoryItem[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [modalImage, setModalImage] = useState<ModalImage | null>(null);
  const [activeTab, setActiveTab] = useState<'edit' | 'tokenize'>('edit');
  const [createdTokenAddress, setCreatedTokenAddress] = useState<string | null>(null);
  const [showEvolutionModal, setShowEvolutionModal] = useState(false);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const objectUrlRef = useRef<string | null>(null);

  // Use blockchain-based experience - but only on client side
  const { experience, experienceLevel, earnExperience } = useExperienceNFT();

  const revokeCurrentObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const isRawFormat = useCallback((file: File) => {
    return isRawFileName(file.name.toLowerCase());
  }, []);

  // Handle client-side hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    return () => {
      revokeCurrentObjectUrl();
    };
  }, [revokeCurrentObjectUrl]);

  // Experience level is now managed by the blockchain hook

  const isSupportedEditFormat = useCallback((file: File | null) => {
    if (!file) return false;
    const lowerName = file.name.toLowerCase();
    if (isSupportedExtension(lowerName)) return true;
    const mime = file.type?.toLowerCase();
    return isSupportedMimeType(mime);
  }, []);

  const supportedFileSelected = useMemo(() => {
    if (!selectedFile) return false;
    return isSupportedEditFormat(selectedFile);
  }, [selectedFile, isSupportedEditFormat]);

  const rawFileSelected = useMemo(() => {
    if (!selectedFile) return false;
    return isRawFormat(selectedFile);
  }, [selectedFile, isRawFormat]);

  const handleFileSelect = useCallback(async (file: File | null) => {
    if (!file) {
      revokeCurrentObjectUrl();
      setSelectedFile(null);
      setPreviewUrl(null);
      setRawPreview(null);
      setMetadata(null);
      setError(null);
      setStatusMessage(null);
      setEditedImageBase64(null);
      setNormalizedInput(null);
      return;
    }

    setSelectedFile(file);
    revokeCurrentObjectUrl();
    setError(null);
    setStatusMessage(null);
    setEditedImageBase64(null);
    setNormalizedInput(null);
    const isSupported = isSupportedEditFormat(file);
    const rawSelected = isRawFormat(file);
    if (!isSupported) {
      setPreviewUrl(null);
      setRawPreview(null);
    } else if (rawSelected) {
      setPreviewUrl(null);
      setRawPreview(null);
    } else {
      const url = URL.createObjectURL(file);
      objectUrlRef.current = url;
      setPreviewUrl(url);
      setRawPreview(null);
    }
    try {
      const extracted = await extractMetadata(file);
      setMetadata(extracted);
      if (rawSelected) {
        if (extracted.embeddedPreviewBase64) {
          setRawPreview({
            base64: extracted.embeddedPreviewBase64,
            mimeType: extracted.embeddedPreviewMimeType ?? "image/jpeg",
          });
          setPreviewUrl(
            `data:${extracted.embeddedPreviewMimeType ?? "image/jpeg"};base64,${extracted.embeddedPreviewBase64}`
          );
        } else {
          setStatusMessage("Rendering RAW preview via Base conversion pipeline...");
          try {
            const base64 = await convertFileToBase64(file);
            const serverPreview = await generateRawPreviewOnServer({
              fileName: file.name,
              base64,
            });
            if (serverPreview) {
              const { previewDataUrl } = serverPreview;
              const [, encoded] = previewDataUrl.split(",");
              const mimeMatch = previewDataUrl.match(/^data:(.*?);base64,/);
              if (encoded) {
                setRawPreview({
                  base64: encoded,
                  mimeType: mimeMatch?.[1] ?? "image/jpeg",
                });
              }
              setPreviewUrl(serverPreview.previewDataUrl);
              setStatusMessage(null);
            } else {
              setStatusMessage("RAW preview unavailable; edits remain supported.");
            }
          } catch (conversionError) {
            console.error("Server RAW preview request failed", conversionError);
            setStatusMessage("RAW preview unavailable; edits remain supported.");
          }
        }
      }
    } catch (err) {
      console.warn("Failed to parse metadata", err);
      setMetadata(null);
    }
  }, [isSupportedEditFormat, revokeCurrentObjectUrl]);

  const convertFileToBase64 = async (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === "string") {
          const base64 = result.split(",")[1] ?? result;
          resolve(base64);
        } else {
          reject(new Error("Unexpected reader result"));
        }
      };
      reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });


  const handleSubmit = useCallback(async () => {
    if (!selectedFile) {
      setError("Upload an image before requesting edits.");
      return;
    }

    if (!supportedFileSelected) {
      setError(
        `Unsupported file. Supported formats: JPEG, PNG, WebP, RAW (${RAW_EXTENSION_DISPLAY.join(", ")}).`
      );
      setStatusMessage(null);
      return;
    }

    setLoading(true);
    setError(null);
    const isRaw = isRawFormat(selectedFile);
    setStatusMessage(
      isRaw ? "Preparing RAW image for edit via Base processing..." : "Submitting edit request to Base processing..."
    );

    try {
      let base64: string;
      let uploadFileName = selectedFile.name;
      const isRawUpload = isRawFormat(selectedFile);
      if (isRawUpload && rawPreview) {
        base64 = rawPreview.base64;
        uploadFileName = `${selectedFile.name.replace(/\.[^.]+$/, "") || selectedFile.name}.jpg`;
      } else {
        base64 = await convertFileToBase64(selectedFile);
      }
      const response = await runImageEdit({
        fileName: uploadFileName,
        originalImageBase64: base64,
        instructions,
        persona,
        metadata: metadata?.raw ?? {},
      });

      setEditedImageBase64(response.editedImageBase64);
      setXmpSidecar(response.xmpSidecar);
      setNormalizedInput({
        base64: response.normalizedInputBase64,
        mimeType: response.normalizedInputMimeType,
        source: response.normalizedInputSource,
      });

      setStatusMessage("Edit complete! Download the XMP sidecar or mint your NFT.");

      // Generate stable ID and timestamp only on client side
      const stableId = isClient ? crypto.randomUUID() : `temp-${Date.now()}`;
      const stableTimestamp = isClient ? new Date().toISOString() : new Date(0).toISOString();

      setHistory((prev) => [
        {
          id: response.editOperations[0]?.id ?? stableId,
          name: selectedFile.name,
          timestamp: stableTimestamp,
          persona,
          instructions,
          xpEarned: 50,
        },
        ...prev,
      ]);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unknown error occurred.");
      setStatusMessage("Edit failed, but you still earned XP for trying!");
    } finally {
      setLoading(false);
    }

    // Always earn experience, regardless of edit success
    const xpEarned = 50;
    try {
      await earnExperience(xpEarned);
      console.log(`Earned ${xpEarned} XP on blockchain`);
      if (editedImageBase64) {
        setStatusMessage(`Edit complete! Earned ${xpEarned} XP. Download the XMP sidecar or mint your NFT.`);
      } else {
        setStatusMessage(`Edit failed, but earned ${xpEarned} XP for trying! Try again with different settings.`);
      }
    } catch (error) {
      console.warn('Failed to earn blockchain experience:', error);
      if (editedImageBase64) {
        setStatusMessage("Edit complete! Download the XMP sidecar or mint your NFT.");
      } else {
        setStatusMessage("Edit failed, but you still earned XP for trying!");
      }
    }
  }, [selectedFile, supportedFileSelected, instructions, persona, metadata, isRawFormat, rawPreview, isClient]);

  const handleMintToken = useCallback(async () => {
    if (!editedImageBase64) {
      setError("Run an edit before minting.");
      return;
    }

    setLoading(true);
    setError(null);
    setStatusMessage("Creating token with AI-generated metadata...");

    try {
      // First, generate token metadata using AI
      const response = await fetch('/api/generate-token-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: editedImageBase64
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`Failed to generate metadata: ${response.status}`);
      }

      const metadata = await response.json();
      console.log('Generated metadata:', metadata);

      // Now create the token using the factory
      setStatusMessage("Creating token on blockchain...");

      // For now, we'll show the metadata that would be used
      // TODO: Implement actual contract call to create token
      setStatusMessage(`Token metadata generated: ${metadata.name} (${metadata.symbol}) - Ready to deploy!`);

      // Earn XP for creating token
      const xpEarned = 100;
      try {
        await earnExperience(xpEarned);
      } catch (error) {
        console.warn('Failed to earn blockchain experience:', error);
      }

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to create token");
      setStatusMessage(null);
    } finally {
      setLoading(false);
    }
  }, [editedImageBase64, experience]);

  const handleMintNFT = useCallback(async () => {
    if (!editedImageBase64) {
      setError("Run an edit before minting.");
      return;
    }

    setLoading(true);
    setError(null);
    setStatusMessage("Minting NFT with Lighthouse storage...");

    try {
      const response = await fetch('/api/mint-nft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: `data:image/png;base64,${editedImageBase64}`,
          name: `Base Studio NFT - ${selectedFile?.name || 'Edited Image'}`,
          description: `AI-enhanced image created with Base Studio. Experience: ${experience} XP`,
          attributes: [
            { trait_type: "Experience", value: experience },
            { trait_type: "Level", value: experienceLevel },
            { trait_type: "Persona", value: personaLabels[persona] },
            { trait_type: "Instructions", value: instructions }
          ]
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to mint NFT (${response.status})`);
      }

      const result = await response.json();

      if (result.isDevelopment) {
        setStatusMessage(`NFT minted successfully! (Development Mode) Image: ${result.imageUrl}, Metadata: ${result.metadataUrl}`);
      } else {
        setStatusMessage(`NFT minted successfully! Image: ${result.imageUrl}, Metadata: ${result.metadataUrl}`);
      }

      // Earn XP for minting
      const xpEarned = 100;
      try {
        await earnExperience(xpEarned);
      } catch (error) {
        console.warn('Failed to earn blockchain experience:', error);
      }

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to mint NFT");
      setStatusMessage(null);
    } finally {
      setLoading(false);
    }
  }, [editedImageBase64, selectedFile?.name, experience, experienceLevel, persona, instructions]);

  const handleDownloadXmp = useCallback(() => {
    if (!xmpSidecar) return;
    const blob = new Blob([xmpSidecar], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${selectedFile?.name ?? "image"}.xmp`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [xmpSidecar, selectedFile?.name]);

  const personaDescriptions: Record<Persona, string> = {
    general: "Balanced adjustments with a human touch.",
    creative: "Bold colors, stylization, and narrative framing.",
    technical: "Restoration, denoise, and detail recovery.",
    manual: "Manual adjustments using sliders and controls.",
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col overflow-x-hidden">
      {/* Mobile-Friendly Header */}
      <MinimalMobileNavbar currentPage="studio" />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-6xl flex flex-col gap-6 lg:gap-8 px-4 sm:px-6 py-6 sm:py-8">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Base Studio</h1>
              <p className="text-sm sm:text-base text-[var(--muted-foreground)] mt-1">
                Professional onchain image editing and tokenization platform.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 sm:px-4 sm:py-3">
                <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Experience</p>
                <p className="text-lg sm:text-2xl font-bold text-[var(--foreground)]">
                  {isClient && experience !== undefined ? experience : 0} XP
                </p>
                <p className="text-xs sm:text-sm text-[var(--muted-foreground)]">
                  Rank: {isClient && experienceLevel ? experienceLevel : "Loading..."}
                </p>
              </div>
            </div>
          </header>

          {isClient && experience !== undefined && (
            <div onClick={() => setShowEvolutionModal(true)} className="cursor-pointer hover:opacity-90 transition-opacity">
              <ExperienceTrack experience={experience} level={experienceLevel} />
            </div>
          )}

          {/* Experience Avatar Component - Only render on client */}
          {/* {isClient && <ExperienceAvatar />} */}

          {/* Tabs */}
          <div className="border-b border-[var(--border)] mb-4 sm:mb-6">
            <div className="flex space-x-4 sm:space-x-8 overflow-x-auto">
              <button
                className={`pb-2 font-medium whitespace-nowrap text-sm sm:text-base ${activeTab === 'edit' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
                onClick={() => setActiveTab('edit')}
              >
                Edit Image
              </button>
              <button
                className={`pb-2 font-medium whitespace-nowrap text-sm sm:text-base ${activeTab === 'tokenize' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
                onClick={() => setActiveTab('tokenize')}
                disabled={!editedImageBase64}
              >
                Create Token
              </button>
            </div>
          </div>

          {activeTab === 'edit' && (
            <><section className="grid grid-cols-1 gap-6 lg:grid-cols-5 lg:gap-10">
              <div className="lg:col-span-2 space-y-6">
                <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--muted-foreground)]">
                    Upload Image
                  </p>
                  <label className="mt-4 flex h-48 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] text-center text-sm text-[var(--muted-foreground)] transition hover:bg-[var(--muted)]">
                    <span className="px-4 text-[var(--foreground)]">{selectedFile ? selectedFile.name : "Drag & drop or click to upload"}</span>
                    <input
                      type="file"
                      accept="image/*,.arw,.cr2,.cr3,.nef,.rw2,.raf,.dng,.pef,.sr2,.orf"
                      className="hidden"
                      onChange={(event) => handleFileSelect(event.target.files?.[0] ?? null)} />
                  </label>
                  {selectedFile && !supportedFileSelected && (
                    <p className="mt-3 text-xs text-[var(--muted-foreground)]">
                      {`This format isn't supported. Try JPEG, PNG, WebP, or RAW (${RAW_EXTENSION_DISPLAY.join(", ")}).`}
                    </p>
                  )}
                  {selectedFile && supportedFileSelected && rawFileSelected && (
                    <p className="mt-3 text-xs text-[var(--muted-foreground)]">
                      {previewUrl
                        ? "Preview rendered via Base processing pipeline."
                        : "Preparing RAW preview via Base pipeline..."}
                    </p>
                  )}
                </div>

                <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
                  <h2 className="mb-3 text-base font-semibold text-[var(--foreground)]">Persona</h2>
                  <div className="flex gap-3">
                    {(Object.keys(personaLabels) as Persona[]).map((key) => (
                      <button
                        key={key}
                        className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${persona === key
                          ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
                          : "border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--muted)]"}`}
                        onClick={() => setPersona(key)}
                      >
                        {personaLabels[key]}
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 text-sm text-[var(--muted-foreground)]">{personaDescriptions[persona]}</p>
                </div>
              </div>

              <div className="lg:col-span-3 space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  <PreviewCard
                    title="Original"
                    imageSrc={previewUrl ?? normalizeToDataUrl(normalizedInput)}
                    fallbackText={selectedFile
                      ? rawFileSelected
                        ? "RAW preview unavailable in-browser, but edits are supported."
                        : "Preview not available for this format"
                      : "Upload an image to preview"}
                    badge={normalizedInput?.source ? `Source: ${normalizedInput.source}` : undefined}
                    onClick={() => {
                      const src = previewUrl
                        ? previewUrl
                        : normalizedInput
                          ? `data:${normalizedInput.mimeType};base64,${normalizedInput.base64}`
                          : null;
                      if (src) {
                        setModalImage({ title: "Original", src, mimeType: normalizedInput?.mimeType });
                      }
                    }} />
                  <PreviewCard
                    title="Edited"
                    imageSrc={editedImageBase64 ? `data:image/png;base64,${editedImageBase64}` : null}
                    fallbackText="Run an edit to preview"
                    onClick={() => {
                      if (editedImageBase64) {
                        setModalImage({
                          title: "Edited",
                          src: `data:image/png;base64,${editedImageBase64}`,
                          mimeType: "image/png",
                        });
                      }
                    }} />
                </div>

                <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
                  <label className="block text-sm font-semibold uppercase tracking-[0.3em] text-[var(--muted-foreground)]">
                    Edit Instructions
                  </label>
                  <textarea
                    className="mt-4 w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--foreground)] shadow-sm focus:border-[var(--foreground)] focus:outline-none"
                    rows={5}
                    value={instructions}
                    onChange={(event) => setInstructions(event.target.value)}
                    placeholder="Describe your desired edits..." />
                  <div className="mt-4 flex flex-col sm:flex-row gap-3">
                    <button
                      className="flex-1 rounded-lg bg-[var(--foreground)] px-4 py-3 text-sm font-medium text-[var(--background)] transition hover:opacity-90"
                      onClick={handleSubmit}
                      disabled={loading || (selectedFile !== null && !supportedFileSelected)}
                    >
                      {loading ? "Processing..." : "Run OpenAI Edit"}
                    </button>
                    <button
                      className="flex-1 rounded-lg border border-[var(--border)] px-4 py-3 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--muted)]"
                      onClick={() => setShowImageEditor(true)}
                      disabled={!previewUrl && !editedImageBase64}
                    >
                      Manual Edit
                    </button>
                    <button
                      className="flex-1 rounded-lg border border-[var(--border)] px-4 py-3 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--muted)]"
                      onClick={handleDownloadXmp}
                      disabled={!xmpSidecar}
                    >
                      Download XMP
                    </button>
                    <button
                      className="flex-1 rounded-lg border border-[var(--border)] px-4 py-3 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--muted)]"
                      onClick={handleMintToken}
                      disabled={!editedImageBase64}
                    >
                      Mint Token
                    </button>
                  </div>
                  {statusMessage && (
                    <p className="mt-3 text-sm text-[var(--muted-foreground)]">{statusMessage}</p>
                  )}
                  {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
                </div>

                {history.length > 0 && (
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-sm">
                    <h2 className="mb-4 text-base font-semibold">Recent Sessions</h2>
                    <ul className="space-y-3">
                      {history.map((item) => (
                        <li key={item.id} className="flex flex-col gap-1 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3">
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="font-medium">{item.name}</span>
                            <span className="rounded-full bg-[var(--muted)] px-2 py-0.5 text-xs text-[var(--muted-foreground)]">
                              {personaLabels[item.persona]}
                            </span>
                            <span className="text-xs text-[var(--muted-foreground)]">
                              {new Date(item.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-[var(--muted-foreground)]">{item.instructions}</p>
                          <span className="text-xs font-semibold text-[var(--foreground)]">+{item.xpEarned} XP</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>
            </>
          )}

          {activeTab === 'tokenize' && editedImageBase64 && (
            <section className="space-y-8">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
                <h2 className="text-xl font-semibold mb-4">Create Meme Token</h2>
                <p className="text-muted-foreground mb-6">Generate a meme token based on your edited image using AI</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <img
                      src={`data:image/png;base64,${editedImageBase64}`}
                      alt="Edited image"
                      className="w-full h-auto rounded-lg mb-4"
                    />
                  </div>
                  <div>
                    <AITokenGenerator
                      imageUrl={editedImageBase64 ? `data:image/png;base64,${editedImageBase64}` : ''}
                      onTokenCreated={(tokenAddress) => {
                        setCreatedTokenAddress(tokenAddress);
                        setActiveTab('edit');
                      }}
                    />
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
      {modalImage ? <Lightbox image={modalImage} onClose={() => setModalImage(null)} /> : null}
      {showEvolutionModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-6 py-12">
          <div className="relative w-full max-w-4xl rounded-3xl bg-[var(--card)] p-6 shadow-2xl outline outline-1 outline-[var(--border)]">
            <button
              className="absolute right-4 top-4 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-sm text-[var(--foreground)] shadow hover:bg-[var(--muted)]"
              aria-label="Close evolution"
              onClick={() => setShowEvolutionModal(false)}
            >
              X
            </button>
            <NFTEvolution />
          </div>
        </div>
      ) : null}

      {showImageEditor && (previewUrl || editedImageBase64) && (
        <ImageEditor
          imageSrc={editedImageBase64 ? `data:image/png;base64,${editedImageBase64}` : previewUrl!}
          onImageChange={async (editedImageSrc) => {
            // Extract base64 from data URL
            const base64 = editedImageSrc.split(',')[1];
            setEditedImageBase64(base64);
            setShowImageEditor(false);

            // Earn experience for manual editing
            const xpEarned = 30; // Slightly less XP for manual edits vs AI edits
            try {
              await earnExperience(xpEarned);
              console.log(`Earned ${xpEarned} XP for manual editing`);
              setStatusMessage(`Manual edit saved! Earned ${xpEarned} XP.`);

              // Add to history
              const stableId = isClient ? crypto.randomUUID() : `temp-${Date.now()}`;
              const stableTimestamp = isClient ? new Date().toISOString() : new Date(0).toISOString();

              setHistory((prev) => [
                {
                  id: stableId,
                  name: selectedFile?.name || 'Manual Edit',
                  timestamp: stableTimestamp,
                  persona: 'manual',
                  instructions: 'Manual editing with sliders',
                  xpEarned,
                },
                ...prev,
              ]);
            } catch (error) {
              console.warn('Failed to earn experience for manual edit:', error);
              setStatusMessage("Manual edit saved!");
            }
          }}
          onClose={() => setShowImageEditor(false)}
        />
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex flex-col">
      <span className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">{label}</span>
      <span className="text-sm text-[var(--foreground)]">{value}</span>
    </div>
  );
}

function PreviewCard({
  title,
  imageSrc,
  fallbackText = "Upload an image to preview",
  badge,
  onClick,
}: {
  title: string;
  imageSrc: string | null;
  fallbackText?: string;
  badge?: string;
  onClick?: () => void;
}) {
  return (
    <div className="flex h-72 flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
      <div className="border-b border-[var(--border)] px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--muted-foreground)]">{title}</h2>
        {badge ? <p className="mt-1 text-xs text-[var(--muted-foreground)]">{badge}</p> : null}
      </div>
      <div
        className={`flex flex-1 items-center justify-center bg-[var(--card)] ${imageSrc && onClick ? "cursor-zoom-in" : ""}`}
        onClick={() => {
          if (imageSrc && onClick) onClick();
        }}
        role={imageSrc && onClick ? "button" : undefined}
        tabIndex={imageSrc && onClick ? 0 : undefined}
        onKeyDown={(event) => {
          if (imageSrc && onClick && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            onClick();
          }
        }}
      >
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={`${title} preview`}
            className="max-h-full max-w-full object-contain"
            onError={(event) => {
              event.currentTarget.src = "";
              event.currentTarget.alt = "Preview not available for this format";
            }}
          />
        ) : (
          <p className="text-sm text-[var(--muted-foreground)]">{fallbackText}</p>
        )}
      </div>
    </div>
  );
}

function normalizeToDataUrl(original?: { base64: string; mimeType: string } | null) {
  if (!original) return null;
  return `data:${original.mimeType};base64,${original.base64}`;
}

function ExperienceTrack({ experience, level }: { experience: number; level: string }) {
  const cappedXp = Math.min(experience, 1000);
  const progress = Math.min(1, cappedXp / 1000);

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-6 py-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-[var(--muted-foreground)]">Creator Journey</p>
          <h2 className="text-xl font-semibold text-[var(--foreground)]">{level}</h2>
        </div>
        <div className="text-sm text-[var(--muted-foreground)]">
          <span className="font-semibold text-[var(--foreground)]">{experience} XP</span>/1000 XP to Visionary
        </div>
      </div>
      <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-[var(--muted)]">
        <div
          className="h-full rounded-full bg-[var(--foreground)] transition-all"
          style={{ width: `${Math.max(5, progress * 100)}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-[var(--muted-foreground)]">
        Earn experience by completing AI-assisted edits. Click to view evolution details.
      </p>
    </section>
  );
}

function Lightbox({ image, onClose }: { image: ModalImage; onClose: () => void }) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-6 py-12">
      <div className="relative w-full max-w-5xl rounded-3xl bg-[var(--card)] p-6 shadow-2xl outline outline-1 outline-[var(--border)]">
        <button
          className="absolute right-4 top-4 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-sm text-[var(--foreground)] shadow hover:bg-[var(--muted)]"
          aria-label="Close preview"
          onClick={onClose}
        >
          X
        </button>
        <h3 className="mb-4 text-lg font-semibold text-[var(--foreground)]">{image.title}</h3>
        <div className="relative h-[70vh] w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
          <img src={image.src} alt={`${image.title} enlarged preview`} className="h-full w-full object-contain" />
        </div>
      </div>
    </div>
  );
}


export default function StudioPage() {
  const { isConnected } = useAccount();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  // Handle client-side mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Redirect to landing page if not connected
  useEffect(() => {
    if (isMounted && !isConnected) {
      router.push("/landing");
    }
  }, [isConnected, router, isMounted]);

  // Show loading state during hydration
  if (!isMounted) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="border-b border-[var(--border)] bg-[var(--background)]">
          <div className="container mx-auto flex justify-between items-center py-3 px-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
              <div className="h-6 w-32 bg-muted animate-pulse rounded" />
            </div>
            <div className="flex items-center gap-4">
              <div className="h-9 w-20 bg-muted animate-pulse rounded-full" />
              <div className="h-9 w-24 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </div>
        <main className="flex-1">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-12">
            <div className="animate-pulse">
              <div className="h-32 w-full bg-muted rounded-2xl mb-8" />
              <div className="h-8 w-48 bg-muted rounded mb-8" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-64 bg-muted rounded-2xl" />
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!isConnected) {
    return null; // Will redirect, no need to render anything
  }

  return <Home />;
}