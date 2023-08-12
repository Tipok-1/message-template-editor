import { useState, useEffect, useCallback } from 'react';
import TemplateEditing from './components/TemplateEditing/TemplateEditing';
import classes from './App.module.css'

function App() {
  const [arrVarNames, setArrVarNames] = useState<string[]>([]);
  const [previewMessageShift, setPreviewMessageShift] = useState(102);

  useEffect(() => {
    if (localStorage.getItem('arrVarNames')) {
      const arrVar = JSON.parse(localStorage.getItem('arrVarNames') as string);
      setArrVarNames(arrVar);
    } else {
      setArrVarNames(['firstname', 'lastname', 'company', 'position']);
    }
  }, [])
  const showPreviewCallback = useCallback(() => setPreviewMessageShift(0), []);
  return (
    <div className={classes.content}>
      <TemplateEditing  arrVarNames={arrVarNames} />
    </div>
  );
}

export default App;
