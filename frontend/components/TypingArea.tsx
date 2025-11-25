"use client";

import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

interface TypingAreaProps {
    initialContent?: string;
    onComplete?: (stats: { cpm: number; accuracy: number }) => void;
}

export function TypingArea({ initialContent = "태초에 하나님이 천지를 창조하시니라", onComplete }: TypingAreaProps) {
    const [input, setInput] = useState("");
    const [targetText, setTargetText] = useState(initialContent);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [shake, setShake] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const [cursorStyle, setCursorStyle] = useState<{ left: number; top: number } | null>(null);
    const [refsReady, setRefsReady] = useState(false);
    const [isComposing, setIsComposing] = useState(false);
    const [confirmedInput, setConfirmedInput] = useState(""); // 조합 완료된 입력

    // 커서 위치 계산 함수
    const updateCursorPosition = useCallback(() => {
        const currentIndex = input.length;
        const containerEl = containerRef.current;
        if (!containerEl) return;

        // 입력 전: 첫 번째 문자 위치
        if (currentIndex === 0) {
            const firstChar = charRefs.current[0];
            if (firstChar) {
                const containerRect = containerEl.getBoundingClientRect();
                const charRect = firstChar.getBoundingClientRect();
                setCursorStyle({
                    left: charRect.left - containerRect.left,
                    top: charRect.top - containerRect.top,
                });
            }
            return;
        }

        // 타이핑 중: 다음 입력할 문자 위치
        const targetChar = charRefs.current[currentIndex];
        if (targetChar) {
            const containerRect = containerEl.getBoundingClientRect();
            const charRect = targetChar.getBoundingClientRect();
            setCursorStyle({
                left: charRect.left - containerRect.left,
                top: charRect.top - containerRect.top,
            });
            return;
        }

        // 완료 상태: 마지막 문자 오른쪽
        const lastChar = charRefs.current[currentIndex - 1];
        if (lastChar) {
            const containerRect = containerEl.getBoundingClientRect();
            const charRect = lastChar.getBoundingClientRect();
            setCursorStyle({
                left: charRect.right - containerRect.left,
                top: charRect.top - containerRect.top,
            });
        }
    }, [input]);

    useEffect(() => {
        setTargetText(initialContent);
        setInput("");
        setStartTime(null);
        setShake(false);
        setRefsReady(false);
        setCursorStyle(null);
        setConfirmedInput("");
        setIsComposing(false);
        inputRef.current?.focus();
    }, [initialContent]);

    // refs 준비 완료 후 커서 위치 초기화
    useLayoutEffect(() => {
        if (refsReady) {
            updateCursorPosition();
        }
    }, [refsReady, updateCursorPosition]);

    // input 변경 시 커서 위치 업데이트
    useLayoutEffect(() => {
        updateCursorPosition();
    }, [input, updateCursorPosition]);

    // resize 이벤트 처리
    useEffect(() => {
        window.addEventListener("resize", updateCursorPosition);
        return () => window.removeEventListener("resize", updateCursorPosition);
    }, [updateCursorPosition]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (!startTime) setStartTime(Date.now());
        setInput(val);

        // 조합 중이 아닐 때 완료 체크 (영문, 숫자, 공백 등)
        if (!isComposing && val === targetText) {
            if (onComplete && startTime) {
                const endTime = Date.now();
                const durationMin = (endTime - startTime) / 60000;
                const cpm = Math.round(targetText.length / durationMin);
                onComplete({ cpm, accuracy: 100 });
            }
        }
    };

    const handleCompositionStart = () => {
        setIsComposing(true);
    };

    const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
        setIsComposing(false);
        const val = e.currentTarget.value;

        // 조합 완료 후 틀린 문자 체크
        if (val.length > confirmedInput.length) {
            const newChar = val[val.length - 1];
            const expectedChar = targetText[val.length - 1];
            if (newChar !== expectedChar) {
                setShake(true);
                setTimeout(() => setShake(false), 200);
            }
        }

        setConfirmedInput(val);

        if (val === targetText) {
            // Completed
            if (onComplete && startTime) {
                const endTime = Date.now();
                const durationMin = (endTime - startTime) / 60000;
                const cpm = Math.round(targetText.length / durationMin);
                onComplete({ cpm, accuracy: 100 });
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // 마지막 글자까지 입력 완료 후 스페이스바나 엔터 누르면 다음으로
        if ((e.key === " " || e.key === "Enter") && input === targetText) {
            e.preventDefault();
            if (onComplete && startTime) {
                const endTime = Date.now();
                const durationMin = (endTime - startTime) / 60000;
                const cpm = Math.round(targetText.length / durationMin);
                onComplete({ cpm, accuracy: 100 });
            }
        }
    };

    // Calculate correctness for styling
    const getCharClass = (index: number) => {
        // 아직 입력 안 된 문자
        if (index >= input.length) return "text-gray-400";

        // 조합 중인 마지막 문자는 회색으로 표시 (아직 확정 안 됨)
        if (isComposing && index === input.length - 1) {
            return "text-gray-400";
        }

        // 확정된 입력과 비교
        if (input[index] === targetText[index]) {
            return "text-foreground";
        }

        // 틀린 문자
        return "text-red-500 bg-red-100";
    };

    return (
        <div className={cn("flex flex-col items-center justify-center w-full max-w-3xl p-8 space-y-8", shake && "animate-shake")} onClick={() => inputRef.current?.focus()}>
            {/* 텍스트 컨테이너 */}
            <div
                ref={containerRef}
                className="relative w-full text-3xl md:text-4xl lg:text-5xl font-serif leading-relaxed tracking-wide text-center break-keep"
            >
                {/* 각 글자를 개별적으로 렌더링 */}
                {targetText.split("").map((targetChar, index) => {
                    const inputChar = input[index];
                    const isTyped = index < input.length;
                    const isCurrentlyTyping = isComposing && index === input.length - 1;
                    const isCorrect = inputChar === targetChar;

                    // 스타일 결정
                    let charClass = "text-gray-300"; // 기본: 아직 입력 안 됨
                    if (isTyped) {
                        if (isCurrentlyTyping) {
                            // 현재 조합 중인 글자 - 검정색으로 표시 (에러 체크 안 함)
                            charClass = "text-foreground";
                        } else if (isCorrect) {
                            // 완료된 글자 - 맞음
                            charClass = "text-foreground";
                        } else {
                            // 완료된 글자 - 틀림
                            charClass = "text-red-500 bg-red-100";
                        }
                    }

                    return (
                        <span
                            key={index}
                            ref={(el) => {
                                charRefs.current[index] = el;
                                if (index === targetText.length - 1 && el && !refsReady) {
                                    setRefsReady(true);
                                }
                            }}
                            className={cn("transition-colors duration-100", charClass)}
                        >
                            {isTyped ? inputChar : targetChar}
                        </span>
                    );
                })}
                {/* 커서 */}
                {cursorStyle && (
                    <span
                        className="absolute w-0.5 h-[1.2em] bg-blue-500 animate-pulse"
                        style={{
                            left: cursorStyle.left,
                            top: cursorStyle.top,
                        }}
                    />
                )}
            </div>

            <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
                className="absolute opacity-0 w-full h-full cursor-default"
                autoFocus
            />

            <div className="text-sm text-muted-foreground mt-8">
                {input.length} / {targetText.length}
            </div>
        </div>
    );
}
