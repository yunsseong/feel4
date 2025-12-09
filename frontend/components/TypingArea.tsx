"use client";

import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "./ThemeProvider";

interface TypingAreaProps {
    initialContent?: string;
    onComplete?: (stats: { cpm: number; accuracy: number }) => void;
    fontFamily?: string;
    fontSize?: number;
    fontColor?: string;
}

export function TypingArea({
    initialContent = "태초에 하나님이 천지를 창조하시니라",
    onComplete,
    fontFamily = "Noto Serif KR",
    fontSize = 24,
    fontColor = "#374151",
}: TypingAreaProps) {
    const { isThemeModalOpen } = useTheme();

    // iframe 내부인지 감지 (임베딩 시 자동 포커스 비활성화)
    const [isEmbedded, setIsEmbedded] = useState(false);
    useEffect(() => {
        setIsEmbedded(window.self !== window.top);
    }, []);

    // 줄바꿈을 공백으로 변환 (input 태그는 줄바꿈 입력 불가)
    const normalizeContent = (text: string) => text.replace(/\s+/g, ' ').trim();
    const [input, setInput] = useState("");
    const [targetText, setTargetText] = useState(normalizeContent(initialContent));
    const startTimeRef = useRef<number | null>(null);
    const [shake, setShake] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const [cursorStyle, setCursorStyle] = useState<{ left: number; top: number; height: number } | null>(null);
    const [refsReady, setRefsReady] = useState(false);
    const [isComposing, setIsComposing] = useState(false);
    const [confirmedInput, setConfirmedInput] = useState(""); // 조합 완료된 입력
    const [cursorVisible, setCursorVisible] = useState(true); // 커서 표시 여부
    const [isCompleted, setIsCompleted] = useState(false); // 입력 완료 여부
    const completionTimerRef = useRef<NodeJS.Timeout | null>(null);

    // 커서 위치 계산 함수
    const updateCursorPosition = useCallback(() => {
        const currentIndex = input.length;
        const containerEl = containerRef.current;
        if (!containerEl) return;

        // 커서 높이를 글자 높이와 동일하게 설정
        const getCursorStyle = (charRect: DOMRect, containerRect: DOMRect, useRight = false) => {
            const cursorHeight = charRect.height;
            const topOffset = 0;
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
        startTimeRef.current = null;
        setShake(false);
        setRefsReady(false);
        setCursorStyle(null);
        setConfirmedInput("");
        setIsComposing(false);
        setIsCompleted(false);
        if (completionTimerRef.current) {
            clearTimeout(completionTimerRef.current);
            completionTimerRef.current = null;
        }
        // iframe 임베딩 시에는 자동 포커스 비활성화
        if (!isEmbedded) {
            inputRef.current?.focus();
        }
    }, [initialContent, isEmbedded]);

    // 페이지 로드 시 자동 포커스 (iframe 임베딩 시 비활성화)
    useEffect(() => {
        if (isEmbedded) return;
        const timer = setTimeout(() => {
            inputRef.current?.focus();
        }, 0);
        return () => clearTimeout(timer);
    }, [isEmbedded]);

    // 항상 포커스 유지: blur 시 재포커스, 윈도우 포커스 시 재포커스 (iframe 임베딩 시 비활성화)
    useEffect(() => {
        if (isEmbedded) return;

        const input = inputRef.current;
        if (!input) return;

        const handleBlur = () => {
            // 약간의 딜레이 후 재포커스 (모달 등 다른 요소 클릭 허용)
            setTimeout(() => {
                if (document.activeElement?.tagName !== 'INPUT' &&
                    document.activeElement?.tagName !== 'BUTTON') {
                    inputRef.current?.focus();
                }
            }, 10);
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                inputRef.current?.focus();
            }
        };

        const handleWindowFocus = () => {
            inputRef.current?.focus();
        };

        // 페이지 어디서든 키 입력 시 입력창으로 포커스
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            // 모달이 열려있으면 무시
            if (isThemeModalOpen) return;
            // 이미 입력창에 포커스되어 있으면 무시
            if (document.activeElement === inputRef.current) return;
            // 특수 키 조합은 무시 (Ctrl, Alt, Meta + 키)
            if (e.ctrlKey || e.altKey || e.metaKey) return;
            // 기능 키는 무시 (F1-F12, Escape, Tab 등)
            if (e.key.startsWith('F') || e.key === 'Escape' || e.key === 'Tab') return;

            // 입력창에 포커스
            inputRef.current?.focus();
        };

        input.addEventListener('blur', handleBlur);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleWindowFocus);
        document.addEventListener('keydown', handleGlobalKeyDown);

        return () => {
            input.removeEventListener('blur', handleBlur);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleWindowFocus);
            document.removeEventListener('keydown', handleGlobalKeyDown);
        };
    }, [isThemeModalOpen, isEmbedded]);

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

    // 폰트 로드 완료 후 커서 위치 재계산
    useEffect(() => {
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => {
                // 폰트 로드 완료 후 약간의 딜레이를 주고 커서 위치 업데이트
                setTimeout(updateCursorPosition, 50);
            });
        }
    }, [updateCursorPosition, fontFamily]);

    // 테마 모달 열림/닫힘 시 커서 처리
    useEffect(() => {
        if (isThemeModalOpen) {
            // 모달이 열리면 커서 숨김
            setCursorVisible(false);
        } else {
            // 모달이 닫히면 CSS 트랜지션 완료 후 커서 위치 재계산 후 표시
            const timer = setTimeout(() => {
                requestAnimationFrame(() => {
                    updateCursorPosition();
                    setCursorVisible(true);
                });
            }, 250);
            return () => clearTimeout(timer);
        }
    }, [isThemeModalOpen, updateCursorPosition]);

    // 입력 완료 감지 및 자동 다음 문장 이동
    const triggerCompletion = useCallback(() => {
        if (isCompleted || !onComplete || !startTimeRef.current) return;

        setIsCompleted(true);
        const endTime = Date.now();
        const durationMin = (endTime - startTimeRef.current) / 60000;
        const cpm = Math.round(targetText.length / durationMin);

        // 200ms 후 자동으로 다음으로 이동
        completionTimerRef.current = setTimeout(() => {
            onComplete({ cpm, accuracy: 100 });
        }, 200);
    }, [isCompleted, onComplete, targetText.length]);

    // input 변경 시 완료 체크 (한글 조합 중에도 길이가 같으면 체크)
    useEffect(() => {
        if (input.length === targetText.length && normalizeText(input) === normalizeText(targetText)) {
            triggerCompletion();
        }
    }, [input, targetText, triggerCompletion]);

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
        if (!startTimeRef.current) startTimeRef.current = Date.now();
        setInput(val);

        // 조합 중이 아닐 때 완료 체크 (영문, 숫자, 공백, 따옴표 정규화)
        if (!isComposing && normalizeText(val) === normalizeText(targetText)) {
            triggerCompletion();
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
            triggerCompletion();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // 스페이스바 처리: 다음 입력해야 할 글자가 공백이 아니면 무시
        if (e.key === " ") {
            const nextCharIndex = input.length;
            const nextExpectedChar = targetText[nextCharIndex];

            // 입력이 완료된 경우 (마지막 글자까지 입력 완료)
            if (normalizeText(input) === normalizeText(targetText)) {
                e.preventDefault();
                // 자동 이동 타이머가 있으면 취소하고 즉시 이동
                if (completionTimerRef.current) {
                    clearTimeout(completionTimerRef.current);
                    completionTimerRef.current = null;
                }
                if (onComplete && startTimeRef.current) {
                    const endTime = Date.now();
                    const durationMin = (endTime - startTimeRef.current) / 60000;
                    const cpm = Math.round(targetText.length / durationMin);
                    onComplete({ cpm, accuracy: 100 });
                }
                return;
            }

            // 다음 글자가 공백이 아니면 스페이스바 무시
            if (nextExpectedChar && !/\s/.test(nextExpectedChar)) {
                e.preventDefault();
                return;
            }
        }

        // 엔터키 처리: 입력 완료 시 즉시 다음으로
        if (e.key === "Enter" && normalizeText(input) === normalizeText(targetText)) {
            e.preventDefault();
            if (completionTimerRef.current) {
                clearTimeout(completionTimerRef.current);
                completionTimerRef.current = null;
            }
            if (onComplete && startTimeRef.current) {
                const endTime = Date.now();
                const durationMin = (endTime - startTimeRef.current) / 60000;
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
                className="relative w-full leading-relaxed tracking-wide text-center break-keep transition-all duration-200"
                style={{
                    fontFamily: fontFamily,
                    fontSize: `${fontSize}px`,
                }}
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

                    // 스타일 결정: 색상과 배경 계산
                    // 아직 입력 안 된 글자는 테마 글자색의 40% 투명도로 표시
                    let charStyle: React.CSSProperties = { color: fontColor, opacity: 0.35 };
                    let charClass = "";

                    if (isTyped) {
                        if (isCurrentlyTyping) {
                            // 현재 조합 중인 글자 - 테마 색상으로 표시 (에러 체크 안 함)
                            charStyle = { color: fontColor, opacity: 1 };
                        } else if (isCorrect) {
                            // 완료된 글자 - 맞음
                            charStyle = { color: fontColor, opacity: 1 };
                        } else {
                            // 완료된 글자 - 틀림
                            charStyle = { color: '#EF4444', opacity: 1 };
                            charClass = "bg-red-100";
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
                            style={charStyle}
                        >
                            {isTyped ? inputChar : targetChar}
                        </span>
                    );
                })}
                {/* 커서 - 위치 계산 완료 전까지 숨김 */}
                {cursorStyle && cursorVisible && (
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
                autoFocus={!isEmbedded}
            />

            <div className="text-sm text-muted-foreground mt-8">
                {input.length} / {targetText.length}
            </div>
        </div>
    );
}
