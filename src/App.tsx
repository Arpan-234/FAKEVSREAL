/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  Upload, 
  ShieldCheck, 
  ShieldAlert, 
  Info, 
  Users, 
  Mail, 
  Loader2, 
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import Markdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility for tailwind class merging
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Initialize Gemini
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface ClassificationResult {
  label: 'Real' | 'Deep Fake';
  confidence: number;
  reasoning: string;
}

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const classifyImage = async () => {
    if (!image) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const base64Data = image.split(',')[1];
      const model = "gemini-3.1-flash-lite-preview";
      
      const prompt = `
        Analyze this image carefully to determine if it is a real photograph or a deepfake/AI-generated image.
        Look for common artifacts such as:
        - Inconsistent lighting or shadows
        - Unnatural textures (skin, hair, backgrounds)
        - Distortions in facial features or symmetry
        - Blurring at edges or blending issues
        - Inconsistent reflections in eyes or glasses
        
        Return your response in JSON format with the following structure:
        {
          "label": "Real" | "Deep Fake",
          "confidence": number (0-100),
          "reasoning": "A detailed explanation of why you reached this conclusion, mentioning specific artifacts or features observed."
        }
      `;

      const response = await genAI.models.generateContent({
        model: model,
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { mimeType: "image/jpeg", data: base64Data } }
          ]
        }],
        config: {
          responseMimeType: "application/json"
        }
      });

      const data = JSON.parse(response.text || "{}");
      setResult(data as ClassificationResult);
    } catch (err) {
      console.error("Classification error:", err);
      setError("Failed to analyze the image. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      {/* Header */}
      <header className="border-b border-[#141414] p-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-8 h-8" />
          <h1 className="text-2xl font-bold tracking-tighter uppercase italic font-serif">DeepFake Guard</h1>
        </div>
        <div className="text-xs font-mono opacity-50 uppercase tracking-widest">
          Version 1.0.4 // Secure Analysis
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Upload & Preview */}
        <div className="lg:col-span-7 space-y-6">
          <section className="bg-white border border-[#141414] p-8 rounded-sm shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
            <h2 className="text-xs font-mono uppercase opacity-50 mb-6 tracking-widest">01. Image Input</h2>
            
            <div 
              onClick={triggerFileInput}
              className={cn(
                "relative border-2 border-dashed border-[#141414] rounded-sm aspect-video flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-black/5",
                image ? "p-4" : "p-12"
              )}
            >
              {image ? (
                <img 
                  src={image} 
                  alt="Preview" 
                  className="max-h-full object-contain rounded-sm"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="text-center">
                  <Upload className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="text-sm font-medium">Click or drag image to upload</p>
                  <p className="text-xs opacity-50 mt-2">Supports JPG, PNG, WebP</p>
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                className="hidden" 
                accept="image/*"
              />
            </div>

            <div className="mt-6 flex gap-4">
              <button
                onClick={classifyImage}
                disabled={!image || isAnalyzing}
                className={cn(
                  "flex-1 py-4 px-6 font-bold uppercase tracking-widest text-sm transition-all border border-[#141414] flex items-center justify-center gap-2",
                  !image || isAnalyzing 
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed" 
                    : "bg-[#141414] text-[#E4E3E0] hover:bg-white hover:text-[#141414]"
                )}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4" />
                    Classify Image
                  </>
                )}
              </button>
              {image && (
                <button
                  onClick={() => { setImage(null); setResult(null); }}
                  className="py-4 px-6 border border-[#141414] hover:bg-red-50 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </section>

          {/* Model Description Section */}
          <section className="bg-white border border-[#141414] p-8 rounded-sm shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
            <div className="flex items-center gap-2 mb-6">
              <Info className="w-4 h-4" />
              <h2 className="text-xs font-mono uppercase opacity-50 tracking-widest">02. Model Description</h2>
            </div>
            <div className="prose prose-sm max-w-none">
              <p className="text-sm leading-relaxed">
                This application utilizes the <strong className="font-bold">Gemini 3.1 Flash</strong> multimodal model, 
                an advanced intelligent system capable of high-fidelity visual analysis. While the core engine is powered 
                by Google's state-of-the-art vision-language architecture, the classification logic is inspired by 
                open-source research in <strong className="font-bold">Vision Transformers (ViT)</strong> and 
                <strong className="font-bold">Convolutional Neural Networks (CNN)</strong> specialized in forensic 
                artifact detection.
              </p>
              <p className="text-xs opacity-60 mt-4 italic">
                * Note: Deepfake detection is an evolving field. This tool provides an AI-driven assessment based on 
                visual patterns and should be used as a supplementary verification layer.
              </p>
            </div>
          </section>
        </div>

        {/* Right Column: Results & Developers */}
        <div className="lg:col-span-5 space-y-6">
          {/* Results Section */}
          <section className="bg-white border border-[#141414] p-8 rounded-sm shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] min-h-[400px]">
            <h2 className="text-xs font-mono uppercase opacity-50 mb-6 tracking-widest">03. Analysis Output</h2>
            
            {isAnalyzing ? (
              <div className="flex flex-col items-center justify-center h-[300px] text-center">
                <Loader2 className="w-12 h-12 animate-spin mb-4 opacity-20" />
                <p className="text-sm font-mono animate-pulse">Scanning for forensic artifacts...</p>
              </div>
            ) : result ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className={cn(
                  "p-6 border-2 flex items-center gap-4",
                  result.label === 'Real' 
                    ? "bg-emerald-50 border-emerald-500 text-emerald-900" 
                    : "bg-red-50 border-red-500 text-red-900"
                )}>
                  {result.label === 'Real' ? <CheckCircle2 className="w-10 h-10" /> : <AlertCircle className="w-10 h-10" />}
                  <div>
                    <div className="text-xs uppercase font-bold opacity-70">Classification</div>
                    <div className="text-3xl font-black uppercase tracking-tighter">{result.label}</div>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="text-xs uppercase font-bold opacity-70">Confidence</div>
                    <div className="text-2xl font-mono font-bold">{result.confidence}%</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xs font-mono uppercase opacity-50 tracking-widest">Forensic Reasoning</h3>
                  <div className="p-4 bg-gray-50 border border-[#141414] text-sm leading-relaxed">
                    <Markdown>{result.reasoning}</Markdown>
                  </div>
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-[300px] text-center text-red-600">
                <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-sm font-bold">{error}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-center opacity-30">
                <ImageIcon className="w-12 h-12 mb-4" />
                <p className="text-sm">Awaiting image for analysis</p>
              </div>
            )}
          </section>

          {/* Developers Section */}
          <section className="bg-[#141414] text-[#E4E3E0] p-8 rounded-sm shadow-[4px_4px_0px_0px_rgba(20,20,20,0.2)]">
            <div className="flex items-center gap-2 mb-6">
              <Users className="w-4 h-4" />
              <h2 className="text-xs font-mono uppercase opacity-50 tracking-widest">04. Developers</h2>
            </div>
            
            <div className="space-y-8">
              <div className="border-l-2 border-[#E4E3E0]/20 pl-4">
                <h3 className="text-lg font-bold tracking-tight uppercase">ARPAN CHOUDHURY</h3>
                <p className="text-xs font-mono opacity-60">VIDYASAGAR UNIVERSITY // MTECH</p>
                <div className="mt-2 flex items-center gap-2 text-xs opacity-80 hover:opacity-100 transition-opacity">
                  <Mail className="w-3 h-3" />
                  <a href="mailto:arpanchoudhury.iitjee@gmail.com">arpanchoudhury.iitjee@gmail.com</a>
                </div>
              </div>

              <div className="border-l-2 border-[#E4E3E0]/20 pl-4">
                <h3 className="text-lg font-bold tracking-tight uppercase">UJJAL DAS</h3>
                <p className="text-xs font-mono opacity-60">VIDYASAGAR UNIVERSITY // MCA</p>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-[#141414] p-8 text-center">
        <p className="text-[10px] font-mono uppercase opacity-40 tracking-[0.2em]">
          &copy; 2026 DeepFake Guard // Forensic Image Analysis Lab
        </p>
      </footer>
    </div>
  );
}
