"use client";
import * as React from "react";
import { toast } from "sonner";
import { ExamWorkspace } from "@/components/exam/ExamWorkspace";
import { SubmitExamDialog } from "@/components/exam/SubmitExamDialog";
import { ExamExpiredScreen } from "@/components/exam/ExamExpiredScreen";
import { useExamAttempt } from "@/lib/hooks/useExamAttempt";
import { useAutosaveAnswer } from "@/lib/hooks/useAutosaveAnswer";
import { useExamTimer } from "@/lib/hooks/useExamTimer";
import { examService } from "@/lib/services/exam.service";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { ExamAnswer, ExamResult } from "@/lib/types/exam";

export function ExamPlayer({ attemptId }: { attemptId:string }) {
  const query=useExamAttempt(attemptId); const save=useAutosaveAnswer(attemptId);
  const [answers,setAnswers]=React.useState<Record<number,ExamAnswer>>({}); const [currentId,setCurrentId]=React.useState(0); const [submitOpen,setSubmitOpen]=React.useState(false); const [submitting,setSubmitting]=React.useState(false); const [result,setResult]=React.useState<ExamResult|null>(null); const [online,setOnline]=React.useState(true);
  React.useEffect(()=>{if(query.data){setAnswers(Object.fromEntries(query.data.answers.map(a=>[a.question_id,a])));setCurrentId(v=>v||query.data.questions[0]?.id||0);}},[query.data]);
  React.useEffect(()=>{const update=()=>setOnline(navigator.onLine);update();window.addEventListener("online",update);window.addEventListener("offline",update);return()=>{window.removeEventListener("online",update);window.removeEventListener("offline",update);};},[]);
  React.useEffect(()=>{if(!query.data||query.data.status!=="in_progress")return;const id=window.setInterval(()=>examService.heartbeat(attemptId).catch(()=>setOnline(false)),30_000);return()=>window.clearInterval(id);},[attemptId,query.data]);
  const submit=React.useCallback(async()=>{if(submitting)return;setSubmitting(true);try{const value=await examService.submit(attemptId);setResult(value);setSubmitOpen(false);}catch(e){toast.error(getApiErrorMessage(e));}finally{setSubmitting(false);}},[attemptId,submitting]);
  const remaining=useExamTimer(query.data?.server_time,query.data?.expires_at,submit);
  if(query.isLoading)return <div className="p-8 text-sm text-muted-foreground">Memuat attempt...</div>;
  if(query.isError||!query.data)return <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{getApiErrorMessage(query.error)}</div>;
  if(result||query.data.status!=="in_progress")return <ExamExpiredScreen score={result?.score_total??null}/>;
  const attempt=query.data; const current=attempt.questions.find(q=>q.id===currentId)??attempt.questions[0]; if(!current)return <div>Paket ujian tidak memiliki soal.</div>;
  const answeredIds=new Set(Object.values(answers).filter(a=>a.question_option_id!=null||a.answer_text).map(a=>a.question_id)); const flaggedIds=new Set(Object.values(answers).filter(a=>a.is_flagged).map(a=>a.question_id));
  const saveValue=(questionId:number,patch:Partial<ExamAnswer>)=>{const previous=answers[questionId];const next:ExamAnswer={question_id:questionId,question_option_id:patch.question_option_id??previous?.question_option_id??null,answer_text:patch.answer_text??previous?.answer_text??null,is_flagged:patch.is_flagged??previous?.is_flagged??false};setAnswers(v=>({...v,[questionId]:next}));save.mutate({questionId,answer:{question_option_id:next.question_option_id,answer_text:next.answer_text,is_flagged:next.is_flagged}},{onError:(e)=>toast.error(getApiErrorMessage(e))});};
  return <><ExamWorkspace title={attempt.schedule.title} accessLabel="Peserta" sections={attempt.sections} questions={attempt.questions} currentId={current.id} selectedOptionId={answers[current.id]?.question_option_id??null} answeredIds={answeredIds} flaggedIds={flaggedIds} remainingMs={remaining} saving={save.isPending} footerStatus={online?"Jawaban tersimpan otomatis":"Koneksi terputus, mencoba sinkron ulang"} onCurrentIdChange={setCurrentId} onSelectOption={(questionId,optionId)=>saveValue(questionId,{question_option_id:optionId})} onToggleFlag={(questionId)=>saveValue(questionId,{is_flagged:!answers[questionId]?.is_flagged})} onFinish={()=>setSubmitOpen(true)} /><SubmitExamDialog open={submitOpen} answered={answeredIds.size} total={attempt.questions.length} submitting={submitting} onOpenChange={setSubmitOpen} onConfirm={submit}/></>;
}
