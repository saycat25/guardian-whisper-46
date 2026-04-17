import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Image as ImageIcon, Upload } from "lucide-react";

export default function Multimodal() {
  const [prompt, setPrompt] = useState("");
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = (f: File) => {
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  };

  return (
    <>
      <PageHeader title="Multimodal" subtitle="Geração e edição de imagens" icon={<ImageIcon className="h-5 w-5 text-primary-foreground" />} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass-panel space-y-3 p-6">
          <h3 className="font-display font-semibold">Gerar imagem</h3>
          <Input placeholder="Descreva a imagem…" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
          <Button className="w-full bg-gradient-primary">Gerar (em breve via edge function)</Button>
          <div className="flex h-56 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
            Preview da imagem gerada
          </div>
        </Card>

        <Card className="glass-panel space-y-3 p-6">
          <h3 className="font-display font-semibold">Upload e edição</h3>
          <label className="flex h-56 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border hover:bg-accent/10">
            {preview ? (
              <img src={preview} alt="upload" className="h-full w-full rounded-lg object-contain" />
            ) : (
              <>
                <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Clique para enviar</span>
              </>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </label>
          <Button variant="outline" className="w-full" disabled>Editar com IA (em breve)</Button>
        </Card>
      </div>
    </>
  );
}
