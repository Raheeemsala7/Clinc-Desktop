"use client"

import { useState } from "react";
import { useDebounce } from "use-debounce";
import { useSearchPatients } from "../hooks/appointments.hook";
import { Loader2, Search } from "lucide-react";
import { BookingFormType, PatientBasic } from "../types/booking";
import { useFormContext } from "react-hook-form";
import { useAppLocale } from "@/shared/hooks/use-app-locale";

export function SearchPatientInput({}) {
    const { tr } = useAppLocale();
    const [searchQuery, setSearchQuery] = useState("");

    const {
        setValue,
    } = useFormContext<BookingFormType>();

    const [debouncedSearchQuery] = useDebounce(
        searchQuery.trim(),
        300,
    );

    const {
        data: searchResults = [],
        isFetching: isSearching,
        isError: isSearchError,
    } = useSearchPatients(debouncedSearchQuery);


    const shouldShowSearchResults =
        searchQuery.trim().length >= 1;
    const isDebouncing =
        searchQuery.trim() !== debouncedSearchQuery;


    // 2. اختيار مريض من نتائج البحث وتحديث النموذج وملخص الحجز فوراً
    const handleSelectPatient = (patient: PatientBasic) => {
        setValue('patientId', patient.id, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
        setValue('patientName', patient.fullName || patient.name || '', { shouldValidate: true, shouldDirty: true, shouldTouch: true });
        setValue('patientPhone', patient.phone, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
        if (patient.gender) {
            setValue('patientGender', patient.gender, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
        }
        if (patient.age !== undefined && patient.age !== null) {
            setValue('patientAge', patient.age, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
            if (Number(patient.age) < 18) {
                setValue('isChild', true, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
            } else {
                setValue('isChild', false, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
            }
        }
        if (patient.chronicConditions && patient.chronicConditions.length > 0) {
            setValue('hasChronicDisease', true, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
            setValue('chronicDiseases', patient.chronicConditions, { shouldValidate: true, shouldDirty: true, shouldTouch: true });

        }
    };
    return (
        <div className="relative flex-1">
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={tr(
                    "ابحث بكود المريض (رقم الملف) أو الاسم أو رقم الهاتف...",
                    "Search by patient file code, name, or phone..."
                )}
                className="w-full h-11 pe-4 ps-10 rounded-xl border border-slate-200 bg-slate-50/50 text-sm placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#0B7B5E] focus:ring-4 focus:ring-[#0B7B5E]/15 transition-all"
            />

            <div className="absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                {isSearching || isDebouncing ? (
                    <Loader2 className="w-4 h-4 text-[#0B7B5E] animate-spin" />
                ) : (
                    <Search className="w-4 h-4 text-slate-400" />
                )}
            </div>

            {/* Search Results */}
            {searchQuery.trim().length > 0 && (
                <div className="absolute top-full mt-1.5 inset-x-0 bg-white rounded-2xl shadow-xl border border-slate-200/80 z-30 max-h-56 overflow-y-auto divide-y divide-slate-100 animate-in fade-in-50">

                    {/* أقل من حرفين */}
                    {!shouldShowSearchResults ? (
                        <div className="p-4 text-center text-xs text-slate-400">
                            {tr("اكتب حرفين على الأقل للبحث.", "Type at least 2 characters to search.")}
                        </div>
                    ) : isDebouncing || isSearching ? (
                        /* Loading */
                        <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0B7B5E]" />
                            <span>{tr("جاري البحث في قاعدة البيانات...", "Searching database...")}</span>
                        </div>
                    ) : isSearchError ? (
                        /* Error */
                        <div className="p-4 text-center text-xs text-rose-500">
                            {tr("حدث خطأ أثناء البحث. حاول مرة أخرى.", "An error occurred while searching. Please try again.")}
                        </div>
                    ) : searchResults.length === 0 ? (
                        /* Empty State */
                        <div className="p-4 text-center text-xs text-slate-400">
                            {tr(
                                'لم يتم العثور على مريض بهذا الاسم. يمكنك الضغط على "+ مريض جديد".',
                                'No patient found. You can click "+ New Patient".'
                            )}
                        </div>
                    ) : (
                        /* Results */
                        searchResults.map((patient) => (
                            <button
                                key={patient.id}
                                type="button"
                                onClick={() => {
                                    handleSelectPatient(patient);
                                    setSearchQuery("");
                                }}
                                className="w-full p-3.5 hover:bg-[#E3F5EE]/60 transition-colors cursor-pointer flex items-center justify-between text-start"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-[#074C3A] text-white flex items-center justify-center font-bold text-xs">
                                        {(patient.name || patient.fullName || tr("م", "P")).charAt(0)}
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-xs text-[#074C3A]">
                                                {patient.name || patient.fullName}
                                            </p>
                                            {((patient as any).fileNumber || (patient as any).fileNo) && (
                                                <span className="font-mono text-[10px] bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded">
                                                    {tr(
                                                        `كود: ${(patient as any).fileNumber || (patient as any).fileNo}`,
                                                        `Code: ${(patient as any).fileNumber || (patient as any).fileNo}`
                                                    )}
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-[11px] text-slate-400 flex items-center flex-wrap gap-1">
                                            <span dir="ltr">{patient.phone}</span>
                                            {patient.age ? tr(` · السن: ${patient.age} سنة`, ` · Age: ${patient.age} yrs`) : ""}
                                            {patient.gender
                                                ? ` · ${patient.gender === "FEMALE" ? tr("أنثى", "Female") : tr("ذكر", "Male")}`
                                                : ""}
                                            {patient.lastVisit
                                                ? tr(` · آخر زيارة: ${patient.lastVisit}`, ` · Last visit: ${patient.lastVisit}`)
                                                : ""}
                                        </p>
                                    </div>
                                </div>

                                <span className="text-xs font-bold text-[#0B7B5E]">
                                    {tr("اختيار", "Select")}
                                </span>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
