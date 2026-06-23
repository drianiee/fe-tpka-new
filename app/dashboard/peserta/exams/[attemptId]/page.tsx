"use client";
import { useParams } from "next/navigation";
import { ExamPlayer } from "@/components/exam/ExamPlayer";
export default function ParticipantExamPage() { const { attemptId }=useParams<{attemptId:string}>(); return <ExamPlayer attemptId={attemptId}/>; }
