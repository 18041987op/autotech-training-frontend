import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Heart, FileText, ExternalLink } from "lucide-react";
import { getBenefits } from "../lib/hrApi";

export function BenefitsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["benefits"],
    queryFn: getBenefits,
  });

  const benefits = data?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Heart className="h-6 w-6 text-sky-600" />
          Benefits
        </h1>
        <p className="text-sm text-slate-500 mt-1">Company benefits and resources</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : benefits.length === 0 ? (
        <div className="card p-8 text-center">
          <Heart className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No benefits information available yet.</p>
          <p className="text-slate-400 text-xs mt-1">Contact your administrator for details.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {benefits.map((benefit) => (
            <div key={benefit.id} className="card p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-sky-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-slate-900">{benefit.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-3">{benefit.description}</p>
                  {benefit.url && (
                    <a
                      href={benefit.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-sky-600 hover:underline mt-2"
                    >
                      Learn more <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
