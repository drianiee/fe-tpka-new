"use client";

import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { questionPackagesService } from "@/lib/services/questionPackages.service";

export function useQuestionPackagesQuery() {
  const qPkgs = useQuery({
    queryKey: [API_ENDPOINTS.QUESTION_PACKAGES.BASE],
    queryFn: () => questionPackagesService.list(),
  });

  return { qPkgs };
}
