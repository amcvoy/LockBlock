!macro customInstall
      CreateShortCut "$SMSTARTUP\LockBlock.lnk" "$INSTDIR\LockBlock.exe"
!macroend

!macro customUnInstall
      delete "$SMSTARTUP\LockBlock.lnk"
!macroend