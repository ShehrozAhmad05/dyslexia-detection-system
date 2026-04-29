function AuthInput({
  id,
  label,
  type = 'text',
  name,
  value,
  onChange,
  onKeyPress,
  placeholder,
  autoComplete,
  error,
  helperText,
  leftAdornment,
  rightAdornment
}) {
  const hasError = Boolean(error);

  return (
    <div className="w-full">
      {label ? (
        <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-slate-700">
          {label}
        </label>
      ) : null}
      <div
        className={`flex items-center rounded-xl border bg-white px-3 transition ${
          hasError
            ? 'border-red-400 ring-2 ring-red-100'
            : 'border-slate-200 focus-within:border-kid-sky focus-within:ring-4 focus-within:ring-kid-sky/15'
        }`}
      >
        {leftAdornment ? <div className="mr-2 flex items-center text-slate-400">{leftAdornment}</div> : null}
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onKeyPress={onKeyPress}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="h-12 w-full border-0 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
        />
        {rightAdornment ? <div className="ml-2 flex items-center">{rightAdornment}</div> : null}
      </div>
      {helperText ? <p className="mt-1 text-xs text-red-500">{helperText}</p> : null}
    </div>
  );
}

export default AuthInput;
