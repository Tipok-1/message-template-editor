import { ButtonHTMLAttributes, memo } from 'react';
import classes from './Button.module.css'
import { GrClose, GrCheckmark } from "react-icons/gr";
import { MdOutlinePreview} from "react-icons/md"

export enum IcoType {
    preview = 'preview',
    close = 'close',
    save = 'save'
}
const Button = ({ className, children, ico, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { ico?: IcoType }) => {
    return (
        <button className={classes.Button + ' ' + (className ? className : '')} {...props}>
            {ico && <div className={classes.ButtonIco}>
                {ico == IcoType.save && <GrCheckmark />}
                {ico == IcoType.close && <GrClose />}
                {ico == IcoType.preview && <MdOutlinePreview/>}
            </div>
            }
            {children}
        </button>
    );
};

export default memo(Button);