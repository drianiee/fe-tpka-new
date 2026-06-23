"use client";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ExamHeader } from "@/components/exam/ExamHeader";
import { QuestionCard } from "@/components/exam/QuestionCard";
import { QuestionNavigator } from "@/components/exam/QuestionNavigator";
import { SectionTabs } from "@/components/exam/SectionTabs";
import { SubmitExamDialog } from "@/components/exam/SubmitExamDialog";
import { ConnectionStatus } from "@/components/exam/ConnectionStatus";
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
  const sectionQuestions=attempt.questions.filter(q=>q.section_id===current.section_id); const answeredIds=new Set(Object.values(answers).filter(a=>a.question_option_id!=null||a.answer_text).map(a=>a.question_id)); const flaggedIds=new Set(Object.values(answers).filter(a=>a.is_flagged).map(a=>a.question_id));
  const saveValue=(questionId:number,patch:Partial<ExamAnswer>)=>{const previous=answers[questionId];const next:ExamAnswer={question_id:questionId,question_option_id:patch.question_option_id??previous?.question_option_id??null,answer_text:patch.answer_text??previous?.answer_text??null,is_flagged:patch.is_flagged??previous?.is_flagged??false};setAnswers(v=>({...v,[questionId]:next}));save.mutate({questionId,answer:{question_option_id:next.question_option_id,answer_text:next.answer_text,is_flagged:next.is_flagged}},{onError:(e)=>toast.error(getApiErrorMessage(e))});};
  return <div className="min-h-[calc(100vh-4rem)] bg-slate-50"><ExamHeader title={attempt.schedule.title} remainingMs={remaining}/><div className="mx-auto grid max-w-7xl gap-4 p-4 lg:grid-cols-[1fr_280px]"><main className="space-y-4"><SectionTabs sections={attempt.sections} activeId={current.section_id} onSelect={id=>setCurrentId(attempt.questions.find(q=>q.section_id===id)?.id??currentId)}/><QuestionCard question={current} selectedId={answers[current.id]?.question_option_id??null} flagged={answers[current.id]?.is_flagged??false} saving={save.isPending} onSelect={id=>saveValue(current.id,{question_option_id:id})} onToggleFlag={()=>saveValue(current.id,{is_flagged:!answers[current.id]?.is_flagged})}/><div className="flex justify-between"><Button variant="outline" onClick={()=>{const i=attempt.questions.findIndex(q=>q.id===current.id);setCurrentId(attempt.questions[Math.max(0,i-1)].id);}}>Sebelumnya</Button><Button onClick={()=>{const i=attempt.questions.findIndex(q=>q.id===current.id);setCurrentId(attempt.questions[Math.min(attempt.questions.length-1,i+1)].id);}}>Berikutnya</Button></div></main><aside className="h-fit space-y-4 rounded-xl border bg-white p-4 lg:sticky lg:top-36"><div className="flex items-center justify-between"><h2 className="font-semibold">Navigasi Soal</h2><ConnectionStatus online={online} saving={save.isPending}/></div><QuestionNavigator questions={sectionQuestions} currentId={current.id} answeredIds={answeredIds} flaggedIds={flaggedIds} onSelect={setCurrentId}/><Button className="w-full" variant="destructive" onClick={()=>setSubmitOpen(true)}>Submit Ujian</Button></aside></div><SubmitExamDialog open={submitOpen} answered={answeredIds.size} total={attempt.questions.length} submitting={submitting} onOpenChange={setSubmitOpen} onConfirm={submit}/></div>;
}
