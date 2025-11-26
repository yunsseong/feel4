"use client";

import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

interface TypingAreaProps {
    initialContent?: string;
    onComplete?: (stats: { cpm: number; accuracy: number }) => void;
}

export function TypingArea({ initialContent = "태초에 하나님이 천지를 창조하시니라", onComplete }: TypingAreaProps) {
    // 줄바꿈을 공백으로 변환 (input 태그는 줄바꿈 입력 불가)
    const normalizeContent = (text: string) => text.replace(/\s+/g, ' ').trim();
    const [input, setInput] = useState("");
    const [targetText, setTargetText] = useState(normalizeContent(initialContent));
    const [startTime, setStartTime] = useState<number | null>(null);
    const [shake, setShake] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const [cursorStyle, setCursorStyle] = useState<{ left: number; top: number; height: number } | null>(null);
    const [refsReady, setRefsReady] = useState(false);
    const [isComposing, setIsComposing] = useState(false);
    const [confirmedInput, setConfirmedInput] = useState(""); // 조합 완료된 입력

    // 커서 위치 계산 함수
    const updateCursorPosition = useCallback(() => {
        const currentIndex = input.length;
        const containerEl = containerRef.current;
        if (!containerEl) return;

        // 커서 높이를 글자 높이의 80%로 설정하고 중앙 정렬
        const getCursorStyle = (charRect: DOMRect, containerRect: DOMRect, useRight = false) => {
            const cursorHeight = charRect.height * 0.8;
            const topOffset = (charRect.height - cursorHeight) / 2;
            return {
                left: (useRight ? charRect.right : charRect.left) - containerRect.left,
                top: charRect.top - containerRect.top + topOffset,
                height: cursorHeight,
            };
        };

        // 입력 전: 첫 번째 문자 위치
        if (currentIndex === 0) {
            const firstChar = charRefs.current[0];
            if (firstChar) {
                const containerRect = containerEl.getBoundingClientRect();
                const charRect = firstChar.getBoundingClientRect();
                setCursorStyle(getCursorStyle(charRect, containerRect));
            }
            return;
        }

        // 타이핑 중: 다음 입력할 문자 위치
        const targetChar = charRefs.current[currentIndex];
        if (targetChar) {
            const containerRect = containerEl.getBoundingClientRect();
            const charRect = targetChar.getBoundingClientRect();
            setCursorStyle(getCursorStyle(charRect, containerRect));
            return;
        }

        // 완료 상태: 마지막 문자 오른쪽
        const lastChar = charRefs.current[currentIndex - 1];
        if (lastChar) {
            const containerRect = containerEl.getBoundingClientRect();
            const charRect = lastChar.getBoundingClientRect();
            setCursorStyle(getCursorStyle(charRect, containerRect, true));
        }
    }, [input]);

    useEffect(() => {
        setTargetText(normalizeContent(initialContent));
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

    // 공백 문자 정규화 함수: 줄바꿈 포함 모든 공백을 일반 공백으로 변환
    const normalizeSpaces = (text: string) => text.replace(/\s+/g, ' ').trim();

    // iOS 스마트 따옴표를 표준 따옴표로 정규화 (Unicode escape 사용)
    const normalizeQuotes = (char: string): string => {
        // 스마트 큰따옴표 → 표준 큰따옴표
        // " (U+201C), " (U+201D), „ (U+201E), « (U+00AB), » (U+00BB)
        if (char === "\u201C" || char === "\u201D" || char === "\u201E" || char === "\u00AB" || char === "\u00BB") {
            return '"';
        }
        // 스마트 작은따옴표/아포스트로피 → 표준 작은따옴표
        // ' (U+2018), ' (U+2019), ‚ (U+201A), ‹ (U+2039), › (U+203A)
        if (char === "\u2018" || char === "\u2019" || char === "\u201A" || char === "\u2039" || char === "\u203A") {
            return "'";
        }
        return char;
    };

    // 전체 텍스트 정규화 (공백 + 따옴표)
    const normalizeText = (text: string): string => {
        return text
            .replace(/\s+/g, ' ')
            .trim()
            .split('')
            .map(normalizeQuotes)
            .join('');
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (!startTime) setStartTime(Date.now());
        setInput(val);

        // 조합 중이 아닐 때 완료 체크 (영문, 숫자, 공백, 따옴표 정규화)
        if (!isComposing && normalizeText(val) === normalizeText(targetText)) {
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

        if (normalizeText(val) === normalizeText(targetText)) {
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
        if ((e.key === " " || e.key === "Enter") && normalizeText(input) === normalizeText(targetText)) {
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
        <div className={cn("flex flex-col items-center justify-start md:justify-center w-full max-w-3xl p-4 md:p-8 pt-8 md:pt-8 space-y-4 md:space-y-8", shake && "animate-shake")} onClick={() => inputRef.current?.focus()}>
            {/* 텍스트 컨테이너 */}
            <div
                ref={containerRef}
                className="relative w-full text-lg md:text-3xl lg:text-4xl font-serif leading-relaxed tracking-wide text-center break-keep"
            >
                {/* 각 글자를 개별적으로 렌더링 */}
                {targetText.split("").map((targetChar, index) => {
                    const inputChar = input[index];
                    const isTyped = index < input.length;
                    const isCurrentlyTyping = isComposing && index === input.length - 1;
                    // 문자 정규화: 공백 + iOS 스마트 따옴표 처리
                    const normalizeChar = (char: string) => {
                        if (!char) return char;
                        // 공백 정규화
                        if (/\s/.test(char)) return ' ';
                        // 따옴표 정규화
                        return normalizeQuotes(char);
                    };
                    const isCorrect = normalizeChar(inputChar) === normalizeChar(targetChar);

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
                            // 디버그 로그 (정규화 전후 비교)
                            console.log(`틀림 감지: index=${index}, inputChar='${inputChar}' (U+${inputChar?.charCodeAt(0).toString(16).toUpperCase()}) → '${normalizeChar(inputChar)}', targetChar='${targetChar}' (U+${targetChar?.charCodeAt(0).toString(16).toUpperCase()}) → '${normalizeChar(targetChar)}'`);
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
                        className="absolute w-0.5 bg-blue-500 animate-pulse"
                        style={{
                            left: cursorStyle.left,
                            top: cursorStyle.top,
                            height: cursorStyle.height,
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
                className="sr-only"
                autoFocus
            />

            <div className="text-sm text-muted-foreground mt-8">
                {input.length} / {targetText.length}
            </div>
        </div>
    );
}
