'use client'
import React, { useEffect, useState } from 'react'
import Select, { components, DropdownIndicatorProps, StylesConfig } from 'react-select'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/utils/cn'

interface CustomSelectProps {
    id?: string
    value: string
    onChange: (value: string) => void
    options: { value: string; label: string }[]
    placeholder?: string
    disabled?: boolean
    className?: string
}

const CustomDropdownIndicator = (props: DropdownIndicatorProps<any, false>) => {
    return (
        <components.DropdownIndicator {...props}>
            <ChevronDown
                size={20}
                className={cn(
                    "text-muted-foreground dark:text-gray-400 transition-all",
                    props.selectProps.isDisabled && "opacity-50",
                    "sm:w-5 sm:h-5"
                )}
            />
        </components.DropdownIndicator>
    );
};

const CustomSelect: React.FC<CustomSelectProps> = ({
    id,
    value,
    onChange,
    options,
    placeholder,
    disabled = false,
    className = ''
}) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const selectedOption = options.find(opt => opt.value === value) || null;

    const customStyles: StylesConfig<any, false> = {
        control: (provided, state) => ({
            ...provided,
            backgroundColor: 'transparent',
            borderColor: state.isFocused ? '#333333' : 'var(--border-default)',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderRadius: '9999px', // rounded-full
            minHeight: 'unset',
            height: '100%',
            boxShadow: 'none',
            cursor: 'pointer',
            opacity: state.isDisabled ? 0.5 : 1,
            '&:hover': {
                borderColor: 'var(--border-hover)'
            },
            padding: '0',
            display: 'flex',
            alignItems: 'center'
        }),
        valueContainer: (provided) => ({
            ...provided,
            padding: '2px 16px', // px-4
            '@media (min-width: 640px)': {
                padding: '4px 16px',
            }
        }),
        input: (provided) => ({
            ...provided,
            margin: 0,
            padding: 0,
            color: 'inherit'
        }),
        placeholder: (provided) => ({
            ...provided,
            color: 'inherit',
            margin: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
        }),
        singleValue: (provided) => ({
            ...provided,
            color: 'inherit',
            margin: 0,
            fontWeight: 500
        }),
        indicatorSeparator: () => ({
            display: 'none'
        }),
        dropdownIndicator: (provided) => ({
            ...provided,
            padding: '0 12px 0 0',
            color: 'inherit',
            '&:hover': {
                color: 'inherit'
            }
        }),
        menu: (provided) => ({
            ...provided,
            backgroundColor: 'var(--bg-menu)',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            zIndex: 50,
            marginTop: '8px'
        }),
        menuList: (provided) => ({
            ...provided,
            padding: '4px',
            backgroundColor: 'transparent'
        }),
        option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isSelected
                ? 'var(--bg-selected)'
                : state.isFocused
                    ? 'var(--bg-hover)'
                    : 'transparent',
            color: state.isSelected
                ? 'var(--text-selected)'
                : 'var(--text-option)',
            cursor: 'pointer',
            padding: '10px 16px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: state.isSelected ? 600 : 500,
            transition: 'all 0.2s ease',
            ':active': {
                backgroundColor: 'var(--bg-active)'
            }
        })
    };

    if (!mounted) return null;

    return (
        <div className={cn("relative w-fit", className)} id={id}>
            <style jsx global>{`
                :root {
                    --bg-menu: #ffffff;
                    --bg-hover: #f3f4f6;
                    --bg-selected: #fee2e2;
                    --bg-active: #fecaca;
                    --text-option: #1f2937;
                    --text-selected: #dc2626;
                    --border-default: #e5e7eb;
                    --border-hover: #414346;
                }
                .dark {
                    --bg-menu: #1f2937;
                    --bg-hover: #374151;
                    --bg-selected: rgba(254, 100, 95, 0.2);
                    --bg-active: rgba(254, 100, 95, 0.3);
                    --text-option: #f3f4f6;
                    --text-selected: #FE645F;
                    --border-default: #4b5563;
                    --border-hover: #6b7280;
                }
            `}</style>
            <Select
                value={selectedOption}
                onChange={(option) => onChange(option ? option.value : '')}
                options={options}
                placeholder={placeholder}
                isDisabled={disabled}
                isSearchable={false}
                styles={customStyles}
                components={{
                    DropdownIndicator: CustomDropdownIndicator
                }}
                className={cn(
                    // Base container styles to match previous look
                    "flex w-full rounded-full bg-background",
                    "text-sm sm:text-base font-medium ring-offset-background",
                    "transition-all duration-200",

                    // Mobile optimized sizing handled by internal padding but container needs min height
                    "h-9 sm:h-10 min-w-[120px]",

                    // Dark mode
                    "dark:bg-gray-800",

                    // Focus (react-select handles focus internally mostly, but we add ring to container if we want, or rely on react-select's implementation. 
                    // To make it look like before, we might need to rely on the border of this container)

                    // Text colors
                    !value && placeholder
                        ? "text-muted-foreground dark:text-gray-400"
                        : "text-foreground dark:text-gray-100",
                )}
                classNamePrefix="react-select"
                unstyled // We use some unstyled props but styles config mainly
            />
        </div>
    )
}

export default CustomSelect


