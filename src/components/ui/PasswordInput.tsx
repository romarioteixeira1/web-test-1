import { useState, type InputHTMLAttributes } from 'react'
import { IconEye, IconEyeOff } from '../layout/icons'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>

/** Password field with an eye button that shows or hides what was typed. */
export function PasswordInput(props: Props) {
  const [visible, setVisible] = useState(false)
  return (
    <span className="pwd">
      <input {...props} type={visible ? 'text' : 'password'} />
      <button
        type="button"
        className="pwd-toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        aria-pressed={visible}
        title={visible ? 'Ocultar senha' : 'Mostrar senha'}
      >
        {visible ? <IconEyeOff size={18} /> : <IconEye size={18} />}
      </button>
    </span>
  )
}
