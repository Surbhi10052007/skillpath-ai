"use client";

import { Modal } from "@/components/ui/Modal";
import { ProjectDetail } from "./ProjectDetail";
import type { Project } from "@/types";

interface ProjectModalProps {
  project: Project | null;
  onClose: () => void;
  matchScore?: number;
  reason?: string;
  onStart?: (project: Project) => void;
  started?: boolean;
}

export function ProjectModal({ project, onClose, matchScore, reason, onStart, started }: ProjectModalProps) {
  return (
    <Modal open={!!project} onClose={onClose} title={project?.title} size="xl">
      {project && (
        <ProjectDetail project={project} matchScore={matchScore} reason={reason} onStart={onStart} started={started} showPageLink />
      )}
    </Modal>
  );
}
