import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export type TitleMode='day'|'week'|'month'|'year';
export type PageTitle={eyebrow:string;title:string;note:string};

export function TitleEditor({mode,value,onChange,onClose,onSave,onReset}:{mode:TitleMode;value:PageTitle;onChange:(value:PageTitle)=>void;onClose:()=>void;onSave:()=>void;onReset:()=>void}){return createPortal(<div className="title-editor-layer"><button className="editor-scrim" onClick={onClose} aria-label="关闭标题编辑"/><section className="title-editor content-glass" role="dialog" aria-modal="true" aria-label="编辑页面标题"><header><div><p className="eyebrow">{({day:'DAY',week:'WEEK',month:'MONTH',year:'YEAR'}[mode])} TITLE</p><h2>自定义页面标题</h2></div><button onClick={onClose} aria-label="关闭"><X/></button></header><label>顶部小字<input value={value.eyebrow} onChange={e=>onChange({...value,eyebrow:e.target.value})}/></label><label>主标题<input value={value.title} onChange={e=>onChange({...value,title:e.target.value})}/></label><label>副标题<textarea value={value.note} onChange={e=>onChange({...value,note:e.target.value})}/></label><footer><button className="quiet" onClick={onReset}>恢复此视图默认</button><div><button className="quiet" onClick={onClose}>取消</button><button className="primary" onClick={onSave}>保存标题</button></div></footer></section></div>,document.body)}
