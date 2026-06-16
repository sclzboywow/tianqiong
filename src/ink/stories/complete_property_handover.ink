-> start

=== start ===
物业移交涉及钥匙、图纸、设备台账和缺陷清单。物业方希望一次交清。

* [按清单完成物业移交]
  -> immediate_fix
* [分批次移交]
  -> schedule_fix
* [先交钥匙后补资料]
  -> ignore_sign

=== immediate_fix ===
你按清单完成移交，双方签字确认。
-> END

=== schedule_fix ===
你分批次移交，关键项已交接。
-> END

=== ignore_sign ===
你先交钥匙，资料后补。
-> END
